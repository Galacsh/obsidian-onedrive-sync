import { ILoggerCallback, LogLevel } from "@azure/msal-common";
import { NodeAuthOptions } from "@azure/msal-node";

import OdsPlugin from "src/main";
import AuthProvider from "src/onedrive/auth";
import { decode, encode } from "src/utils";
import { PROTOCOL_HANDLER } from "src/constants";

import { IAuthManager } from "src/types";
import { TAuthStatus, TAuthStorage } from "src/onedrive/auth/types";

export default class AuthManager implements IAuthManager {
	private readonly auth: AuthProvider;

	constructor(private plugin: OdsPlugin) {
		const secrets: NodeAuthOptions = {
			clientId: process.env.ONEDRIVE_CLIENT_ID as string,
			authority: process.env.ONEDRIVE_AUTHORITY as string,
		};

		const storageKey = plugin.manifest.id;

		const storage: TAuthStorage = {
			load: () => {
				return decode(plugin.app.loadLocalStorage(storageKey));
			},
			save: (value) => {
				let encoded = undefined;
				if (value) encoded = encode(value) as string;
				plugin.app.saveLocalStorage(storageKey, encoded);
			},
		};

		const logger: ILoggerCallback = (level, message, containsPii) => {
			if (level === LogLevel.Info) console.log(message);
			else if (level === LogLevel.Error) console.error(message);
		};

		this.auth = new AuthProvider(
			secrets,
			storage,
			PROTOCOL_HANDLER,
			logger
		);

		this.registerEventHandlers();
	}

	getProvider() {
		return this.auth;
	}

	async getAuthCodeUrl(): Promise<string> {
		return await this.auth.getAuthCodeUrl();
	}

	async getAuthStatus(): Promise<TAuthStatus> {
		return await this.auth.getAuthStatus();
	}

	private registerEventHandlers() {
		// Sign in
		this.plugin.events.on("AUTH:SIGN_IN", "AuthManager", async (code) => {
			await this.auth.acquireToken(code);
		});

		// Sign out
		this.plugin.events.on("AUTH:SIGN_OUT", "AuthManager", async () => {
			await this.auth.signOut();
		});
	}
}
