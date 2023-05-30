export type TAuthStorage = {
	load: () => string | null;
	save: (value: string | undefined) => void;
};

export type TAuth = {
	verifier?: string;
	accessToken?: string;
	refreshToken?: string;
	expiresAt?: number;
};

export type TAuthResponse = {
	access_token: string;
	refresh_token?: string;
	expires_in: number;
};

export type TAuthStatus =
	| "NOT_INITIALIZED"
	| "NOT_AUTHENTICATED"
	| "EXPIRED"
	| "EXPIRED_REFRESHABLE"
	| "AUTHENTICATED";
