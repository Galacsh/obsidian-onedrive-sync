import { Setting } from "obsidian";

import OdsPlugin from "src/main";
import AuthModal from "./modal";
import { TAuthStatus } from "src/onedrive/auth/types";
import { URI_CONSENT_MANAGE } from "../../../onedrive/client/constants";

const STATUS_PREFIX = "Status: ";

export default class AuthSettingsUI {
	private authOptionUI: Setting;
	private authModal: AuthModal;

	constructor(private container: HTMLElement, private plugin: OdsPlugin) {}

	async init() {
		this.registerEventHandlers();

		this.showTitle();
		await this.initAuthOption();
	}

	private registerEventHandlers() {
		this.plugin.events.on(
			"AUTH:SIGN_IN",
			"AuthSettingsUI",
			this.onSignIn.bind(this)
		);
		this.plugin.events.on(
			"AUTH:SIGN_OUT",
			"AuthSettingsUI",
			this.onSignOut.bind(this)
		);
	}

	/**
	 * Called when the user successfully signs in.
	 */
	private onSignIn() {
		this.setStatus("AUTHENTICATED");
	}

	/**
	 * Called when the user successfully signs out.
	 */
	onSignOut() {
		this.setStatus("NOT_AUTHENTICATED");
	}

	// ==================== //
	// UI related functions //
	// ==================== //

	/**
	 * Creates a title.
	 */
	private showTitle() {
		this.container.createEl("h3", { text: "Auth" });
	}

	private async initAuthOption() {
		this.authOptionUI = new Setting(this.container);
		this.authModal = new AuthModal(this.plugin);

		this.showStatusPlaceholder();
		this.showDescription();
		this.showSignInButton();
		this.showSignOutButton();

		await this.loadStatus();
	}

	/**
	 * Shows a placeholder on the name of the setting component.
	 */
	private showStatusPlaceholder() {
		this.setStatus("NOT_INITIALIZED");
	}

	/**
	 * Load and show the current auth status
	 * on the name of the setting component.
	 */
	private async loadStatus() {
		const status: TAuthStatus = await this.plugin.auth.getAuthStatus();
		this.setStatus(status);
	}

	/**
	 * Show auth status on the name.
	 *
	 * @param status The auth status to show.
	 */
	private setStatus(status: TAuthStatus) {
		let statusMessage: string;
		switch (status) {
			case "NOT_INITIALIZED":
				statusMessage = "Loading...";
				break;
			case "AUTHENTICATED":
				statusMessage = "Signed In";
				break;
			case "NOT_AUTHENTICATED":
				statusMessage = "No Auth";
				break;
			case "EXPIRED":
				statusMessage = "Expired";
				break;
			case "EXPIRED_REFRESHABLE":
				statusMessage = "Expired (Automatically Refreshable)";
				break;
			default:
				statusMessage = "Unknown - Report this to the developer";
				break;
		}
		this.authOptionUI.setName(STATUS_PREFIX + statusMessage);
	}

	/**
	 * Shows the description of the setting component.
	 */
	private showDescription() {
		const description = this.authOptionUI.descEl;
		description.createSpan({
			text:
				"Sign in to OneDrive and enable this plugin to sync your vault. " +
				"Sign out to disable this plugin to sync your vault. " +
				"You can fully disable this plugin's access to your OneDrive by ",
		});
		description.createEl("a", {
			text: "clicking here",
			href: URI_CONSENT_MANAGE,
		});
		description.createSpan({ text: "." });
	}

	/**
	 * Creates a button to open the auth modal.
	 */
	private showSignInButton() {
		this.authOptionUI.addButton((button) => {
			button.setButtonText("Sign In").onClick(() => {
				this.authModal.open();
			});
		});
	}

	/**
	 * Creates a button to sign out.
	 */
	private showSignOutButton() {
		this.authOptionUI.addButton((button) => {
			button.setButtonText("Sign Out").onClick(async () => {
				this.plugin.events.fire("AUTH:SIGN_OUT");
			});
		});
	}
}
