import { Modal } from "obsidian";

import OdsPlugin from "src/main";

export default class CloneToLocalModal extends Modal {
	private container: HTMLElement;

	constructor(private plugin: OdsPlugin) {
		super(plugin.app);
		this.container = this.contentEl;
	}

	/**
	 * Opens the modal.
	 */
	async onOpen() {
		// Clear
		this.container.empty();

		// Create modal content
		this.showTitle();
		this.showDescription();
		this.showButtons();
	}

	// ==================== //
	// UI related functions //
	// ==================== //

	/**
	 * Creates a title.
	 */
	private showTitle() {
		this.container.createEl("h3", { text: "Clone OneDrive → Local" });
	}

	/**
	 * Creates a description.
	 */
	private showDescription() {
		this.container.createEl("p", {
			text: "This will clone your OneDrive vault to Local vault.",
		});

		this.showHowItWorks();
		this.showCautions();
	}

	/**
	 * Creates a description of how it works.
	 */
	private showHowItWorks() {
		const ol = this.container.createEl("ol");
		ol.createEl("li", {
			text: "This process will first delete all files in your Local vault.",
		});
		ol.createEl("li", {
			text: "Then it will download all files from your OneDrive vault.",
		});
		ol.createEl("li", {
			text: "Wait for a few seconds until the process finishes.",
		});
		ol.createEl("li", {
			text: "You'll see a notification when the process finishes.",
		});
	}

	/**
	 * Creates a description of cautions.
	 */
	private showCautions() {
		this.container
			.createEl("p")
			.createEl("strong", { text: "Cautions" }).style.color = "ORANGE";

		const ul = this.container.createEl("ul");
		ul.createEl("li", {
			text: "Do not close the app while processing.",
		});
		ul.createEl("li", {
			text: 'This do not download files in the "Ignore On Download" list.',
		});
		ul.createEl("li", {
			text: "Cloning may take a while depending on the size of your vault.",
		});
	}

	/**
	 * Creates buttons.
	 */
	private showButtons() {
		const div = this.container.createDiv();
		div.style.float = "right";

		this.showConfirmButton(div);
		this.showCancelButton(div);
	}

	/**
	 * Creates a button that copies the given link to the clipboard.
	 *
	 * @param div The div to create the button in.
	 */
	private showConfirmButton(div: HTMLDivElement) {
		const button = div.createEl("button", {
			text: "Confirm",
		});
		button.style.marginRight = "1rem";
		button.onclick = async () => {
			await this.plugin.oneDrive.cloneToLocal();
		};
	}

	/**
	 * Creates a button that shows the given link.
	 *
	 * @param div The div to create the button in.
	 */
	private showCancelButton(div: HTMLDivElement) {
		const button = div.createEl("button", {
			text: "Cancel",
		});
		button.onclick = () => this.close();
	}
}
