import { Setting } from "obsidian";

import OdsPlugin from "src/main";
import IgnoreFilesDescription from "./description";
import { isEveryPatternValid } from "./util";
import { OneDriveSyncNotice as Notice } from "src/components";

export default class IgnoreFilesSettingsUI {
	constructor(private container: HTMLElement, private plugin: OdsPlugin) {}

	async init() {
		this.showTitle();
		this.showIntro();
		this.showSetting();

		return this;
	}

	// ==================== //
	// UI related functions //
	// ==================== //

	/**
	 * Creates a title.
	 */
	private showTitle() {
		this.container.createEl("h3", { text: "Ignore Files" });
	}

	/**
	 * Notes about ignore files.
	 */
	private showIntro() {
		new IgnoreFilesDescription(this.container).init();
	}

	/**
	 * Settings for ignore files.
	 */
	private showSetting() {
		const setting = new Setting(this.container);

		this.showSettingTitle(setting);
		this.showSettingDescription(setting);
		this.showPatternInput(setting);
	}

	/**
	 * Creates a title.
	 */
	private showSettingTitle(setting: Setting) {
		setting.setName("Patterns to ignore");
	}

	/**
	 * Creates a description.
	 */
	private showSettingDescription(setting: Setting) {
		setting.setDesc("Add patterns here to ignore files.");
	}

	/**
	 * Creates a text area for inputting patterns.
	 */
	private showPatternInput(setting: Setting) {
		setting.addTextArea(async (textArea) => {
			const savedPatterns = this.plugin.settings.of(
				(data) => data.ignore
			);

			textArea.inputEl.style.minHeight = "5rem";
			textArea
				.setPlaceholder(".*\\/\\.obsidian\\/?.*")
				.setValue(savedPatterns.join("\n"))
				.onChange(async (value) => {
					// Pre-test the pattern, if it is invalid, show a warning
					const patterns = value.split("\n").filter((p) => p !== "");
					const isValid = isEveryPatternValid(patterns);

					if (!isValid) {
						new Notice("Invalid Regex", 1000);
					} else {
						new Notice("Valid Regex", 1000);
						// Save the pattern
						await this.plugin.settings.update((settings) => {
							settings.ignore = patterns;
						});
					}
				});
		});
	}
}
