import { PromisePool } from "@supercharge/promise-pool";
import { DriveItem, NullableOption } from "@microsoft/microsoft-graph-types";

import OdsPlugin from "src/main";
import { OneDriveSyncNotice as Notice } from "src/components";
import OneDriveClient from "src/onedrive/client";
import IgnoreHandler from "./ignore-handler";
import { links } from "src/onedrive/client/helper";

import { IOneDriveManager, TIndexItem } from "src/types";

export default class OneDriveManager implements IOneDriveManager {
	private readonly oneDrive: OneDriveClient;
	private readonly vaultName: string;
	private readonly ignoreHandler: IgnoreHandler;

	private busy: boolean;

	constructor(private plugin: OdsPlugin) {
		this.oneDrive = new OneDriveClient(plugin.auth.getProvider());
		this.vaultName = plugin.app.vault.getName();
		this.ignoreHandler = plugin.ignoreHandler;
		this.busy = false;
	}

	async sync() {
		await this.ifAuth(async () => {
			// Do nothing if something is in progress
			if (this.isIndexing() || this.isBusy()) return;

			// Pull changes
			await this.pull();
			// Push changes
			await this.push();
		});
	}

	async cloneToLocal() {
		await this.ifAuth(async () => {
			// Do nothing if something is in progress
			if (this.isIndexing() || this.isBusy()) return;
			this.busy = true;

			new Notice("Cloning from OneDrive to local vault");

			// Clear the local vault
			await this.plugin.vault.clear();

			// Clear the OneDrive index
			await this.plugin.settings.update((s) => {
				s.oneDriveIndex = {};
			});

			// Fetch the list of files from OneDrive
			const oneDriveIndex = await this.oneDrive.trackChanges(
				this.vaultName
			);

			// Download the files to the local vault
			await this.downloadOrDeleteFiles(oneDriveIndex.items);

			// Save the deltaLink
			await this.plugin.settings.update((s) => {
				s.deltaLink = oneDriveIndex.deltaLink;
			});

			this.busy = false;
			new Notice("Finished cloning");

			this.plugin.vault.clearIndex();
			await this.plugin.vault.buildIndex();
		});
	}

	async cloneToOneDrive() {
		await this.ifAuth(async () => {
			// Do nothing if something is in progress
			if (this.isIndexing() || this.isBusy()) return;
			this.busy = true;

			new Notice("Cloning local vault to OneDrive");

			// Clear the OneDrive vault
			await this.clearOneDrive();

			// Get all the files in the local vault
			const allFiles = await this.plugin.vault.getAllFiles();
			const allFilesArray = Object.values(allFiles);

			// Upload them to OneDrive
			await this.uploadFiles(allFilesArray);

			// Save the deltaLink and update the index
			const deltaLink = await this.oneDrive.getLatestDelta();
			await this.plugin.settings.update((s) => {
				s.deltaLink = deltaLink;
			});

			this.busy = false;
			new Notice("Finished cloning");

			this.plugin.vault.clearIndex();
			await this.plugin.vault.buildIndex();
		});
	}

	async pull() {
		await this.ifAuth(async () => {
			if (this.isPullPushNotAvailable()) return;
			else this.busy = true;

			// Get delta link
			const currentDeltaLink = this.plugin.settings.of(
				(s) => s.deltaLink as string
			);

			// Fetch the changes of files from OneDrive
			const { items, deltaLink } =
				await this.oneDrive.trackChangesByDeltaLink(currentDeltaLink);

			// Reflect changes to the local vault
			await this.downloadOrDeleteFiles(items);

			// Update delta link
			await this.plugin.settings.update((s) => (s.deltaLink = deltaLink));

			this.busy = false;
			new Notice("Finished pulling", 2000);
		});
	}

	async push() {
		await this.ifAuth(async () => {
			if (this.isPullPushNotAvailable()) return;
			else this.busy = true;

			const { toUpload, toDelete } = this.plugin.vault.getIndex();

			// Delete files
			await this.deleteFiles([...toDelete]);

			// Upload new files
			const filesToUpload = Object.values(toUpload);
			await this.uploadFiles(filesToUpload);

			// Clear the index
			this.plugin.vault.clearIndex();

			// Update delta link
			const deltaLink = await this.oneDrive.getLatestDelta();
			await this.plugin.settings.update((s) => (s.deltaLink = deltaLink));

			this.busy = false;
			new Notice("Finished pushing", 2000);
		});
	}

	// ==============
	//  == Private ==
	// ==============

	private async ifAuth(func: () => Promise<void>) {
		const status = await this.plugin.auth.getAuthStatus();
		switch (status) {
			case "NOT_INITIALIZED":
			case "NOT_AUTHENTICATED":
				new Notice("Sign in required\n(Settings > OneDrive Sync)");
				break;
			default:
				await func();
				break;
		}
	}

	private isIndexing(): boolean {
		return this.plugin.vault.isIndexing;
	}

	private isBusy(): boolean {
		return this.busy;
	}

	private hasNoDeltaLink() {
		return this.plugin.settings.of((s) => s.deltaLink == null);
	}

	private isPullPushNotAvailable() {
		let isAvailable = false;

		if (this.hasNoDeltaLink()) {
			new Notice("Need cloning first\n(Settings > OneDrive Sync)");
		} else if (this.isIndexing()) {
			new Notice("Indexing is in progress. Try again later.", 2000);
		} else if (this.isBusy()) {
			new Notice("Something is in progress. Try again later.", 2000);
		} else {
			isAvailable = true;
		}

		return !isAvailable;
	}

	private async hasVaultFolder() {
		try {
			await this.oneDrive.getItemByPath(this.vaultName);
			return true;
		} catch (e) {
			return false;
		}
	}

	private async clearOneDrive() {
		if (await this.hasVaultFolder()) {
			await this.oneDrive.deleteByPath(this.vaultName);
		}
		await this.oneDrive.createRootFolder(this.vaultName);
	}

	private async deleteFiles(paths: string[]) {
		let finished = 0;
		const notice = new Notice(`Deleted (${finished}/${paths.length})`);

		await PromisePool.for(paths)
			.withConcurrency(100)
			.handleError((e, t) => console.log(e, t))
			.onTaskFinished(() =>
				notice.setMessage(`Deleted (${++finished}/${paths.length})`)
			)
			.process(async (path) => await this.deleteFile(path));

		notice.setMessage(`Deleted (${finished}/${paths.length})`);
		notice.hideAfter(1500);
	}

	private async deleteFile(path: string) {
		await this.oneDrive.deleteByPath([this.vaultName, path].join("/"));

		await this.plugin.settings.update((s) => delete s.oneDriveIndex[path]);
	}

	private async uploadFiles(indexedFiles: TIndexItem[]) {
		let finished = 0;
		const notice = new Notice(
			`Uploaded (${finished}/${indexedFiles.length})`
		);

		await PromisePool.for(indexedFiles)
			.withConcurrency(100)
			.handleError((e, t) => console.log(e, t))
			.onTaskFinished(() => {
				notice.setMessage(
					`Uploaded (${++finished}/${indexedFiles.length})`
				);
			})
			.process(async (file) => await this.uploadFile(file));

		notice.setMessage(`Uploaded (${finished}/${indexedFiles.length})`);
		notice.hideAfter(1500);
	}

	private async uploadFile(file: TIndexItem) {
		const content = await this.plugin.vault.read(file.path);

		if (content.byteLength > 4 * 1024 * 1024) {
			await this.oneDrive.uploadLargeFile(
				new Uint8Array(content),
				[this.vaultName, file.path].join("/"),
				content.byteLength
			);
		} else {
			await this.oneDrive.uploadByPath(
				new Uint8Array(content),
				[this.vaultName, file.path].join("/")
			);
		}

		await this.plugin.settings.update(
			(s) => (s.oneDriveIndex[file.path] = file)
		);
	}

	private async downloadOrDeleteFiles(items: DriveItem[]) {
		let finished = 0;
		const notice = new Notice(`Handled (${finished}/${items.length})`);

		await PromisePool.for(items)
			.withConcurrency(100)
			.handleError((e) => console.log(e))
			.onTaskFinished(() =>
				notice.setMessage(`Handled (${++finished} /${items.length})`)
			)
			.process(async (item) => {
				if (item.deleted) await this.deleteLocalFile(item);
				else await this.downloadFile(item);
			});

		notice.setMessage(`Handled (${finished}/${items.length})`);
		notice.hideAfter(2000);
	}

	private async downloadFile(item: DriveItem): Promise<void> {
		const asIndex = this.toIndexItem(item);
		if (asIndex == null) return;

		// Check if the item should be ignored
		if (this.ignoreHandler.isIgnored(asIndex.path)) return;

		const indexedItem = this.plugin.vault.getIndex().toUpload[asIndex.path];

		// Handle creation or modification
		if (
			indexedItem == null ||
			asIndex.stat.mtime > indexedItem.stat.mtime
		) {
			// Create the folder if it doesn't exist
			if (asIndex.stat.type === "folder") {
				await this.plugin.vault.createFolderIfNotExists(asIndex.path);
			}
			// Download the file
			else {
				// @ts-ignore
				const downloadLink = item[links.download] as string;
				const response = await fetch(downloadLink as string);
				const content = await response.arrayBuffer();

				// Update the OneDrive index
				await this.plugin.settings.update((s) => {
					s.oneDriveIndex[asIndex.path] = asIndex;
				});

				// Write the file to the local vault
				await this.plugin.vault.write(asIndex, content);
			}
		}
	}

	private async deleteLocalFile(item: DriveItem): Promise<void> {
		const asIndex = this.toIndexItem(item);
		if (asIndex == null) return;

		// Check if the item should be ignored
		if (this.ignoreHandler.isIgnored(asIndex.path)) return;

		// Update the OneDrive index
		await this.plugin.settings.update((s) => {
			delete s.oneDriveIndex[asIndex.path];
		});

		await this.plugin.vault.delete(asIndex.path);
	}

	private toIndexItem(item: DriveItem): TIndexItem | null {
		const relativePath = this.toRelativePath(
			item.parentReference?.path,
			item.name as string,
			this.vaultName
		);

		if (relativePath == null || relativePath === "") return null;

		return {
			name: item.name as string,
			path: relativePath,
			stat: {
				type: item.folder ? "folder" : "file",
				ctime: new Date(item.createdDateTime as string).getTime(),
				mtime: new Date(item.lastModifiedDateTime as string).getTime(),
				size: item.size as number,
			},
		} as TIndexItem;
	}

	private toRelativePath(
		oneDrivePath: NullableOption<string> | undefined,
		oneDriveFileName: string,
		rootFolderName: string
	) {
		const fullPath = oneDrivePath + "/" + oneDriveFileName;
		const startOfRoot = fullPath.indexOf(rootFolderName);
		if (startOfRoot === -1) return null;

		return fullPath.substring(startOfRoot + rootFolderName.length + 1);
	}
}
