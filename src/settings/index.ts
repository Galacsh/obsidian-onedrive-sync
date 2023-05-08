import { Plugin } from "obsidian";
import {
	TSettings,
	ISettingsManager,
	TSettingsExtractor,
	TSettingsUpdater,
} from "../types";

import DEFAULT_SETTINGS from "./default";
import SettingsUI from "./ui";

export default class SettingsManager implements ISettingsManager {
	private settings: TSettings;

	constructor(public plugin: Plugin) {}

	/**
	 * 1. Load the settings.
	 * 2. Add the settings tab.
	 */
	async init(): Promise<ISettingsManager> {
		this.settings = await this.load();

		const tab = new SettingsUI(this.plugin, this);
		this.plugin.addSettingTab(tab);

		return this;
	}

	/**
	 * Returns the current settings
	 *
	 * @returns The current settings
	 */
	get(): TSettings {
		return this.settings;
	}

	/**
	 * Returns a value from the settings
	 *
	 * @param extractor The function to extract the value from the settings
	 */
	of<T>(extractor: TSettingsExtractor<T>): T {
		return extractor(this.settings);
	}

	/**
	 * Updates the settings
	 *
	 * @param updater The function to update the settings
	 */
	async update(updater: TSettingsUpdater): Promise<void> {
		updater(this.settings);
		await this.plugin.saveData(this.settings);
	}

	// ==============

	/**
	 * Loads the settings.
	 * Applies default values to missing settings.
	 *
	 * @private
	 * @returns The settings
	 */
	private async load(): Promise<TSettings> {
		const savedSettings = await this.plugin.loadData();
		return Object.assign({}, DEFAULT_SETTINGS, savedSettings);
	}
}
