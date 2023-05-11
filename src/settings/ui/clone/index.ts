import { Setting } from "obsidian";

import OdsPlugin from "src/main";
import CloneToLocalModal from "./to-local";
import CloneToOneDriveModal from "./to-onedrive";

export default class CloneSettingsUI {
	private cloneOptions: Setting;
	private cloneToLocalModal: CloneToLocalModal;
	private cloneToOneDriveModal: CloneToOneDriveModal;

	constructor(private container: HTMLElement, private plugin: OdsPlugin) {}

	async init() {
		this.showTitle();
		this.showCloneOptions();
		return this;
	}

	// ==================== //
	// UI related functions //
	// ==================== //

	private showCloneOptions() {
		this.cloneOptions = new Setting(this.container);

		this.initCloneOptionModals();

		this.showDescription();
		this.showModalButton("Clone to local", this.cloneToLocalModal);
		this.showModalButton("Clone to OneDrive", this.cloneToOneDriveModal);
	}

	/**
	 * Initializes the clone options UI.
	 */
	private initCloneOptionModals() {
		this.cloneToLocalModal = new CloneToLocalModal(this.plugin);
		this.cloneToOneDriveModal = new CloneToOneDriveModal(this.plugin);
	}

	/**
	 * Creates a title.
	 */
	private showTitle() {
		this.container.createEl("h3", { text: "Clone" });
	}

	/**
	 * Shows the description of the setting component.
	 */
	private showDescription() {
		this.cloneOptions.setDesc(
			"You can clone your vault to OneDrive " +
				"or clone your OneDrive vault to your local vault."
		);
	}

	/**
	 * Creates a button to open a modal.
	 */
	private showModalButton(
		text: string,
		modalToOpen: CloneToLocalModal | CloneToOneDriveModal
	) {
		this.cloneOptions.addButton((button) => {
			button.setButtonText(text).onClick(() => {
				modalToOpen.open();
			});
		});
	}
}
