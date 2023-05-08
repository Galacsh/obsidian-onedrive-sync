import { Plugin } from "obsidian";
import SettingsManager from "./settings";

export default class OneDriveSyncPlugin extends Plugin {
	async onload() {
		// Initialize Settings
		const settings = await new SettingsManager(this).init();
		console.log("Settings", settings.get()); // TODO: Remove

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

	// ======================
	// == Protocol Handler ==
	// ======================

	private registerSignInHandler() {
		this.registerObsidianProtocolHandler(
			"onedrive-sync",
			async ({ code }) => {
				// TODO: Publish event to handle sign in
				throw new Error("Not implemented");
			}
		);
	}
}
