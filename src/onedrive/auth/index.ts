import { request } from "obsidian";
import {
	AuthError,
	AuthorizationUrlRequest,
	CryptoProvider,
	LogLevel,
	NodeAuthOptions,
	PublicClientApplication,
} from "@azure/msal-node";
import { ILoggerCallback } from "@azure/msal-common";

import { AUTH_CONFIG } from "./constants";

import {
	TAuth,
	TAuthResponse,
	TAuthStatus,
	TAuthStorage,
	TPkce,
} from "./types";

/**
 * Handles authentication.
 *
 * @see https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/samples/msal-node-samples/ElectronSystemBrowserTestApp/src/AuthProvider.ts
 */
export default class AuthProvider {
	private pca: PublicClientApplication;

	constructor(
		private readonly secrets: NodeAuthOptions,
		private readonly storage: TAuthStorage,
		private readonly redirectUri: string,
		private readonly logger?: ILoggerCallback
	) {
		this.pca = new PublicClientApplication({
			auth: secrets,
			system: {
				loggerOptions: {
					loggerCallback: logger,
					piiLoggingEnabled: false,
					logLevel:
						process.env.NODE_ENV === "development"
							? LogLevel.Info
							: LogLevel.Error,
				},
			},
		});
	}

	/**
	 * Get auth status.
	 *
	 * @returns Auth status.
	 * @see https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/token-lifetimes.md
	 */
	async getAuthStatus(): Promise<TAuthStatus> {
		const auth = await this.getStoredAuth();

		// No auth stored
		if (!auth || auth.expiresAt == null) {
			return "NOT_AUTHENTICATED";
		}
		// If access token is expired
		else if (auth.expiresAt < Date.now()) {
			const refreshTokenExpiresAt = auth.expiresAt + 1000 * 60 * 60 * 23; // Refresh token is valid for 24 hours
			// If refresh token is alive
			if (refreshTokenExpiresAt > Date.now()) {
				return "EXPIRED_REFRESHABLE";
			}
			// If refresh token is expired
			else {
				return "EXPIRED";
			}
		}
		// If access token is alive
		else {
			return "AUTHENTICATED";
		}
	}

	/**
	 * Get a link URL to get a 'code'.
	 * The 'code' will be used to acquire 'access_token'.
	 *
	 * @returns URL to acquire 'code'.
	 */
	async getAuthCodeUrl() {
		// Create PKCE Codes before starting the authorization flow
		const crypto = new CryptoProvider();
		const pkce: TPkce = Object.assign(
			{ challengeMethod: AUTH_CONFIG.challengeMethod },
			await crypto.generatePkceCodes()
		);

		// Store verifier for further use
		await this.updateVerifier(pkce.verifier);

		const params = {
			redirectUri: this.redirectUri,
			scopes: AUTH_CONFIG.scopes,
			codeChallenge: pkce.challenge, // PKCE Code Challenge
			codeChallengeMethod: pkce.challengeMethod, // PKCE Code Challenge Method
		} as AuthorizationUrlRequest;

		return await this.pca.getAuthCodeUrl(params);
	}

	/**
	 * Acquire 'access_token' by using 'code' or 'refresh_token' or stored 'access_token'.
	 * If refreshed, the new 'access_token' will be stored automatically.
	 *
	 * @param code The 'code' to acquire 'access_token'.
	 * @returns The 'access_token'.
	 * @throws {AuthError} If no stored auth found.
	 */
	async acquireToken(code?: string) {
		if (code) {
			return await this.acquireTokenByCode(code);
		}

		const auth = await this.getStoredAuth();

		if (auth == null || auth.expiresAt == null) {
			throw new AuthError(
				"NO_STORED_AUTH",
				"Not signed in.\nVisit Settings > OneDrive Sync."
			);
		} else if (auth.expiresAt < Date.now()) {
			return await this.acquireTokenByRefreshToken();
		} else {
			return auth.accessToken;
		}
	}

	/**
	 * Get 'access_token' using 'code'.
	 *
	 * @param code The 'code' to acquire 'access_token'.
	 * @returns The 'access_token'.
	 * @throws {AuthError} If no stored verifier found.
	 */
	private async acquireTokenByCode(code: string) {
		const verifier = await this.getStoredVerifier();
		if (!verifier) {
			throw new AuthError(
				"NO_VERIFIER",
				"Not signed in.\nVisit Settings > OneDrive Sync."
			);
		}

		try {
			const response = JSON.parse(
				await request({
					url: `${this.secrets.authority}/oauth2/v2.0/token`,
					method: "POST",
					contentType: "application/x-www-form-urlencoded",
					body: new URLSearchParams({
						tenant: "consumers",
						client_id: this.secrets.clientId,
						scope: AUTH_CONFIG.scopes.join(" "),
						code: code,
						redirect_uri: this.redirectUri,
						grant_type: "authorization_code",
						code_verifier: verifier,
					}).toString(),
				})
			);

			await this.updateStoredAuth(response);
			return response.access_token;
		} catch (e) {
			throw new AuthError(
				"CODE_ERROR",
				"Failed to acquire access token using code.\nReport this issue to the developer."
			);
		}
	}

	/**
	 * Get 'access_token' using 'refresh_token'.
	 *
	 * @returns The 'access_token'.
	 */
	private async acquireTokenByRefreshToken() {
		const auth = await this.getStoredAuth();

		if (auth?.refreshToken) {
			try {
				const response = JSON.parse(
					await request({
						url: `${this.secrets.authority}/oauth2/v2.0/token`,
						method: "POST",
						contentType: "application/x-www-form-urlencoded",
						body: new URLSearchParams({
							tenant: "consumers",
							client_id: this.secrets.clientId,
							scope: AUTH_CONFIG.scopes.join(" "),
							refresh_token: auth.refreshToken,
							grant_type: "refresh_token",
						}).toString(),
					})
				);
				await this.updateStoredAuth(response);
				return response.access_token;
			} catch (e) {
				throw new AuthError(
					"REFRESH_TOKEN_ERROR",
					"Refresh token expired.\nYou need to re-authenticate."
				);
			}
		} else {
			throw new AuthError(
				"NO_REFRESH_TOKEN",
				"Refresh token not found.\nYou need to re-authenticate."
			);
		}
	}

	/**
	 * Sign out by clearing stored auth.
	 */
	async signOut() {
		await this.clearAuth();
	}

	/**
	 * Get stored values related to auth.
	 *
	 * @returns The stored auth
	 */
	private async getStoredAuth() {
		const auth = await this.storage.load();
		return auth ? (JSON.parse(auth) as TAuth) : {};
	}

	/**
	 * Update stored auth.
	 *
	 * @param response The response of the auth request.
	 */
	private async updateStoredAuth(response: TAuthResponse) {
		const stored = await this.getStoredAuth();

		const auth = {
			accessToken: response.access_token,
			refreshToken: response.refresh_token
				? response.refresh_token
				: stored
				? stored.refreshToken
				: undefined,
			expiresAt: Date.now() + response.expires_in * 1000,
		} as TAuth;

		await this.storage.save(JSON.stringify(auth));
	}

	/**
	 * Update stored verifier.
	 *
	 * @param verifier The verifier to update.
	 */
	private async updateVerifier(verifier: string) {
		if (!verifier) {
			throw new AuthError(
				"INVALID_VERIFIER",
				"Verifier should not be empty"
			);
		}

		const stored = await this.getStoredAuth();
		const updated = Object.assign({}, stored, { verifier }) as TAuth;
		await this.storage.save(JSON.stringify(updated));
	}

	/**
	 * Get the stored verifier.
	 *
	 * @returns Stored verifier.
	 */
	private async getStoredVerifier() {
		const stored = await this.getStoredAuth();
		return stored.verifier;
	}

	/**
	 * Clear stored auth.
	 */
	private async clearAuth() {
		await this.storage.save(undefined);
	}
}
