import { Setting } from "obsidian";

export default class IgnoreFilesDescription {
	private readonly setting: Setting;

	constructor(private container: HTMLElement) {
		this.setting = new Setting(container);
	}

	init() {
		this.showDescription(this.setting);
		this.showCaution(this.setting);
		this.showExample(this.setting);
	}

	private showDescription(intro: Setting) {
		intro.descEl.createDiv().createEl("p", {
			text:
				"Basically, all the files will be synced. " +
				"You can ignore some files by adding patterns here.",
		});
	}

	private showCaution(intro: Setting) {
		const caution = intro.descEl.createEl("ul");
		caution.createEl("li", {
			text: "Each pattern should be on a new line.",
		});
		caution.createEl("li", {
			text: "Note that the patterns are case-sensitive.",
		});
	}

	private showExample(intro: Setting) {
		intro.descEl.createEl("p", {
			text:
				"For example, the following pattern will ignore " +
				"all the contents in the Obsidian config folder :",
		});

		const example = intro.descEl.createEl("ul");

		// Input
		const input = example.createEl("li");
		input.createSpan({ text: "Pattern : " });
		input.createEl("code", {
			text: "\\.obsidian",
		});

		// Output
		const output = example.createEl("li");
		output.createSpan({ text: "→ " });
		output.createEl("code", {
			text: 'new RegExp("\\\\.obsidian")',
		});
	}
}
