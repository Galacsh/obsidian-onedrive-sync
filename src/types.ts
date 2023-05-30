import { Stat } from "obsidian";
import { TAuthStatus } from "./onedrive/auth/types";
import AuthProvider from "./onedrive/auth";

// Load and save local storage
declare module "obsidian" {
	interface App {
		loadLocalStorage(key: string): string | null;
		saveLocalStorage(key: string, value: string | undefined): void;
	}
}

// =====================
// Plugin Events Related
// =====================

export type TEventType =
	| "AUTH:SIGN_IN"
	| "AUTH:SIGN_OUT"
	| "IGNORE_PATTERN:CHANGED";

export type TEventSubscriber =
	| "AuthSettingsUI"
	| "AuthModal"
	| "AuthManager"
	| "OneDriveManager"
	| "VaultManager";

export type TEventArgs = Parameters<TEventCallback>;

// @ts-ignore
export type TEventCallback = (...data) => unknown;

// ================
// Settings Related
// ================

export type TSettingsExtractor<T> = (data: TSettings) => T;
export type TSettingsUpdater = (data: TSettings) => void;

export interface ISettingsManager {
	get: () => TSettings;
	of: <T>(extractor: TSettingsExtractor<T>) => T;
	update: (updater: TSettingsUpdater) => Promise<void>;
	init: () => Promise<void>;
}

export type TIndexItem = {
	name: string;
	path: string;
	stat: Stat;
};
export type TIndexedFiles = {
	[filePath: string]: TIndexItem;
};
export type TIndex = {
	toUpload: TIndexedFiles;
	toDelete: Set<string>;
};
export type TSettings = {
	deltaLink: string | null;
	oneDriveIndex: TIndexedFiles;
	ignore: string[];
};

// ============
// Auth Related
// ============

export interface IAuthManager {
	getProvider: () => AuthProvider;
	getAuthCodeUrl: () => Promise<string>;
	getAuthStatus: () => TAuthStatus;
}

// ================
// OneDrive Related
// ================

export interface IOneDriveManager {
	sync: () => Promise<void>;
	cloneToLocal: () => Promise<void>;
	cloneToOneDrive: () => Promise<void>;
	pull: () => Promise<void>;
	push: () => Promise<void>;
}

// =============
// Vault Related
// =============

export interface IVaultManager {
	isIndexing: boolean;

	init: () => Promise<void>;
	getIndex: () => TIndex;
	buildIndex: () => Promise<void>;
	getAllFiles: () => Promise<TIndexedFiles>;
	read: (path: string) => Promise<ArrayBuffer>;
	write: (item: TIndexItem, content: ArrayBuffer) => Promise<void>;
	createFolderIfNotExists: (path: string) => Promise<void>;
	clear: () => Promise<void>;
	clearIndex: () => void;
	delete: (path: string) => Promise<void>;
}
