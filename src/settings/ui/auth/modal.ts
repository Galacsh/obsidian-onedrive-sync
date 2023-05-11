import { Modal } from "obsidian";

import OdsPlugin from "src/main";
import { OneDriveSyncNotice as Notice } from "../../../components";

export default class AuthModal extends Modal {
	constructor(private plugin: OdsPlugin) {
		super(plugin.app);
	}

	/**
	 * Opens the modal.
	 */
	async onOpen() {
		this.plugin.events.on(
			"AUTH:SIGN_IN",
			"AuthModal",
			this.close.bind(this)
		);

		// Clear
		this.contentEl.empty();

		// Create modal contentEl
		this.showTitle();
		this.showDescription();

		await this.showButtons();
	}

	// ==========
	// UI Related
	// ==========

	/**
	 * Creates a title.
	 */
	showTitle() {
		this.titleEl.empty();
		this.titleEl.createSpan({ text: "Auth" });
	}

	/**
	 * Creates a description.
	 */
	showDescription() {
		const ol = this.contentEl.createEl("ol");
		ol.createEl("li", {
			text: "Click one of the buttons below to copy the link",
		});
		ol.createEl("li", {
			text: "Open the link in your browser.",
		});
		ol.createEl("li", {
			text: "Sign in and enable the app.",
		});
		ol.createEl("li").createEl("strong", {
			text: "After signing in, let the browser redirect you to Obsidian.",
		});
		ol.createEl("li", {
			text: "Wait for a few seconds until the modal closes automatically.",
		});
	}

	/**
	 * Creates buttons to copy the auth link to the clipboard
	 * and to show a link to be opened the in the browser.
	 */
	async showButtons() {
		const div = this.contentEl.createDiv();
		div.style.display = "flex";
		div.style.justifyContent = "end";

		const authLink = "https://github.com"; // TODO: Get auth link
		this.showLinkButton(div, authLink);
		this.showCopyButton(div, authLink);
	}

	/**
	 * Creates a button that copies the given link to the clipboard.
	 *
	 * @param div The div to create the button in.
	 * @param link The link to copy to the clipboard.
	 */
	showCopyButton(div: HTMLDivElement, link: string) {
		const button = div.createEl("button", {
			text: "Copy to Clipboard",
		});

		button.onclick = async () => {
			await navigator.clipboard.writeText(link);
			new Notice("Copied", 1000);
		};
	}

	/**
	 * Creates a button that shows the given link.
	 *
	 * @param div The div to create the button in.
	 * @param link The link to show.
	 */
	showLinkButton(div: HTMLDivElement, link: string) {
		const button = div.createEl("button", {
			text: "Show Link",
		});
		button.style.marginRight = "1rem";
		button.onclick = () => {
			const p = this.contentEl.createEl("p");
			p.style.wordBreak = "break-all";
			p.createEl("a", { text: link, href: link });
			button.hide();
		};
	}
}
