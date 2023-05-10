import { Plugin } from "obsidian";

import SettingsManager from "./settings";
import { log, PluginEvents } from "./components";

export default class OneDriveSyncPlugin extends Plugin {
	events: PluginEvents;

	async onload() {
		// Initialize events
		this.events = new PluginEvents();

		// Initialize Settings
		const settings = await new SettingsManager(this).init();
		log("Settings", settings.get()); // TODO: Remove

		// TODO: Initialize things
		// - Read all files in vault and build index
		// - Register file change events handler to update index
		// - OneDrive related things
		// - Event Store (Subscribe to events, publish events)

		this.registerCommands();
		this.registerSignInHandler();
	}

	async onunload() {
		// TODO: Clean up things
	}

	// ==============
	// == Commands ==
	// ==============

	/**
	 * Registers all commands
	 */
	private registerCommands() {
		this.addCloneToOneDriveCommand();
		this.addCloneToLocalCommand();
		this.addSyncCommand();
		this.addTestCommand();
	}

	private addCloneToOneDriveCommand() {
		this.addCommand({
			id: "clone-to-onedrive",
			name: "Clone Local vault to OneDrive vault",
			callback: async () => {
				// TODO: Clone Local vault to OneDrive vault
				throw new Error("Not implemented");
			},
		});
	}

	private addCloneToLocalCommand() {
		this.addCommand({
			id: "clone-to-local",
			name: "Clone OneDrive vault to Local vault",
			callback: async () => {
				// TODO: Clone OneDrive vault to Local vault
				throw new Error("Not implemented");
			},
		});
	}

	private addSyncCommand() {
		this.addCommand({
			id: "sync",
			name: "Sync",
			callback: async () => {
				// TODO: Sync Local vault with OneDrive vault
				throw new Error("Not implemented");
			},
		});
	}

	private addTestCommand() {
		this.addCommand({
			id: "test",
			name: "Test",
			callback: async () => {
				this.events.fire("AUTH:SIGN_IN");
			},
		});
	}

	// ======================
	// == Protocol Handler ==
	// ======================

	private registerSignInHandler() {
		this.registerObsidianProtocolHandler(
			"onedrive-sync",
			async ({ code }) => {
				this.events.fire("AUTH:SIGN_IN", code);
			}
		);
	}
}
