import { Plugin, PluginSettingTab } from "obsidian";
import { ISettingsManager } from "../../types";

export default class OneDriveSyncSettingsUI extends PluginSettingTab {
	constructor(plugin: Plugin, private settings: ISettingsManager) {
		super(plugin.app, plugin);
	}

	display() {
		const { containerEl } = this;

		containerEl.empty();
		containerEl.createEl("h1", { text: "OneDrive Sync" });
	}
}
