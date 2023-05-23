import { Plugin } from "obsidian";

import SettingsManager from "./settings";
import AuthManager from "./bridge/auth";
import OneDriveManager from "./bridge/onedrive";
import VaultManager from "./bridge/vault";
import { HANDLER_ACTION } from "./constants";
import { log, PluginEvents } from "./components";

import {
	IAuthManager,
	IOneDriveManager,
	ISettingsManager,
	IVaultManager,
} from "./types";
import IgnoreHandler from "./bridge/ignore-handler";

export default class OneDriveSyncPlugin extends Plugin {
	events: PluginEvents;
	settings: ISettingsManager;
	ignoreHandler: IgnoreHandler;
	auth: IAuthManager;
	oneDrive: IOneDriveManager;
	vault: IVaultManager;

	async onload() {
		log("Initialize events");
		this.events = new PluginEvents();

		log("Initialize Settings");
		this.settings = new SettingsManager(this);
		await this.settings.init();

		log("Initialize Ignore Handler");
		this.ignoreHandler = new IgnoreHandler(this);

		log("Initialize Auth");
		this.auth = new AuthManager(this);

		log("Initialize OneDrive");
		this.oneDrive = new OneDriveManager(this);

		log("Initialize Vault Manager");
		this.vault = new VaultManager(this);
		this.vault.init().then(() => {});

		log("Register commands");
		this.registerCommands();

		log("Register protocol handler");
		this.registerSignInHandler();

		log("Finished loading");
	}

	async onunload() {
		log("Unloading plugin");
		this.events.clear();
		log("Cleared events");
		log("Unloaded plugin");
	}

	// ==============
	// == Commands ==
	// ==============

	/**
	 * Registers all commands
	 */
	private registerCommands() {
		this.addPullCommand();
		this.addPushCommand();
		this.addSyncCommand();
	}

	private addPullCommand() {
		this.addCommand({
			id: "pull",
			name: "Pull",
			callback: async () => {
				log("Start pulling");
				await this.oneDrive.pull();
				log("Finished pulling");
			},
		});
	}

	private addPushCommand() {
		this.addCommand({
			id: "push",
			name: "Push",
			callback: async () => {
				log("Start pushing");
				await this.oneDrive.push();
				log("Finished pushing");
			},
		});
	}

	private addSyncCommand() {
		this.addCommand({
			id: "sync",
			name: "Sync",
			callback: async () => {
				log("Start syncing");
				await this.oneDrive.sync();
				log("Finished syncing");
			},
		});
	}

	// ======================
	// == Protocol Handler ==
	// ======================

	private registerSignInHandler() {
		this.registerObsidianProtocolHandler(HANDLER_ACTION, ({ code }) => {
			log("Received code from OneDrive");
			this.events.fire("AUTH:SIGN_IN", code);
		});
	}
}
