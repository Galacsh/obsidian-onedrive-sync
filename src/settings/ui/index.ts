import { PluginSettingTab } from "obsidian";

import OdsPlugin from "src/main";
import AuthUI from "./auth";
import IgnoreFilesUI from "./ignore-files";
import CloneSettingsUI from "./clone";

export default class OneDriveSyncSettingsUI extends PluginSettingTab {
	constructor(private plugin: OdsPlugin) {
		super(plugin.app, plugin);
	}

	async display() {
		const { containerEl } = this;

		containerEl.empty();
		containerEl.createEl("h1", { text: "OneDrive Sync" });

		await new AuthUI(containerEl.createDiv(), this.plugin).init();
		await new IgnoreFilesUI(containerEl.createDiv(), this.plugin).init();
		await new CloneSettingsUI(containerEl.createDiv(), this.plugin).init();
	}
}
