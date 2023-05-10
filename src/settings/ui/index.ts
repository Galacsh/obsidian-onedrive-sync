import { PluginSettingTab } from "obsidian";

import Plugin from "src/main";
import AuthSettingsUI from "./auth";

export default class OneDriveSyncSettingsUI extends PluginSettingTab {
	constructor(private plugin: Plugin) {
		super(plugin.app, plugin);
	}

	async display() {
		const { containerEl } = this;

		containerEl.empty();
		containerEl.createEl("h1", { text: "OneDrive Sync" });

		await new AuthSettingsUI(containerEl.createDiv(), this.plugin).init();
		// TODO: IgnoreFilesSettingsUI
		// TODO: CloneOptionsUI
	}
}
