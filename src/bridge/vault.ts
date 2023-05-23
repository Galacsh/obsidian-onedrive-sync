import { TFile } from "obsidian";
import { PromisePool } from "@supercharge/promise-pool";

import OdsPlugin from "src/main";
import LocalVault from "src/local";
import { log } from "src/components";
import IgnoreHandler from "./ignore-handler";

import { IVaultManager, TIndex, TIndexItem } from "src/types";

export default class VaultManager implements IVaultManager {
	private vault: LocalVault;
	private ignoreHandler: IgnoreHandler;
	private readonly index: TIndex;
	isIndexing: boolean;

	constructor(private plugin: OdsPlugin) {
		this.vault = new LocalVault(plugin.app.vault);
		this.ignoreHandler = this.plugin.ignoreHandler;
		this.index = {
			toUpload: {},
			toDelete: new Set<string>(),
		};
		this.isIndexing = false;
	}

	/**
	 * Initializes the indexer
	 */
	async init() {
		this.registerIgnorePatternChangeHandler();
		this.registerFileChangeHandlers();
		await this.buildIndex();
		log("Built index", this.index);
	}

	/**
	 * Returns the index.
	 * Index is an object with two properties:
	 *
	 * - toUpload: Object with paths as keys and file metadata as values. These files will be uploaded to OneDrive.
	 * - toDelete: Set of paths to be deleted
	 */
	getIndex() {
		return this.index;
	}

	/**
	 * Build the index.
	 * Compares the local vault with the OneDrive
	 * and finds the files to be uploaded and deleted.
	 */
	async buildIndex() {
		this.isIndexing = true;

		// Clear the index
		this.clearIndex();

		// Bring OneDrive index from settings
		const oneDriveFiles = this.plugin.settings.of((s) => s.oneDriveIndex);
		const oneDrivePaths = Object.keys(oneDriveFiles);

		// Get all files in vault
		const localIndexedFiles = await this.getAllFiles();
		const localPaths = Object.keys(localIndexedFiles);

		// Check for created and updated files
		for (const localPath of localPaths) {
			if (this.ignoreHandler.isIgnored(localPath)) continue;
			if (
				oneDriveFiles[localPath] == null ||
				oneDriveFiles[localPath].stat.mtime !==
					localIndexedFiles[localPath].stat.mtime
			) {
				this.index.toUpload[localPath] = localIndexedFiles[localPath];
			}
		}

		// Check for deleted files
		for (const oneDrivePath of oneDrivePaths) {
			if (this.ignoreHandler.isIgnored(oneDrivePath)) continue;
			if (localIndexedFiles[oneDrivePath] == null) {
				this.index.toDelete.add(oneDrivePath);
			}
		}

		this.isIndexing = false;
	}

	/**
	 * Returns all the files in the vault.
	 * Ignores the files matching the ignore patterns.
	 */
	async getAllFiles() {
		const ignorePatterns = this.ignoreHandler.getIgnorePatterns();
		return await this.vault.getAllFiles(ignorePatterns);
	}

	async createFolderIfNotExists(path: string): Promise<void> {
		return await this.vault.createFolderIfAbsent(path);
	}

	async write(item: TIndexItem, content: ArrayBuffer): Promise<void> {
		await this.vault.write(item, content);

		// Remove from toUpload and toDelete
		if (this.index.toUpload[item.path] != null) {
			delete this.index.toUpload[item.path];
		}
		if (this.index.toDelete.has(item.path)) {
			this.index.toDelete.delete(item.path);
		}
	}

	async read(path: string) {
		return await this.vault.read(path);
	}

	async clear() {
		const items = await this.getAllFiles();
		await PromisePool.for(Object.keys(items))
			.withConcurrency(100)
			.handleError((e, t) => console.log(e, t))
			.process(async (item) => {
				await this.plugin.app.vault.adapter.remove(item);
			});
	}

	clearIndex() {
		this.index.toDelete.clear();
		this.index.toUpload = {};
	}

	/**
	 * Delete a file from the vault.
	 * Silently fails if the file doesn't exist.
	 *
	 * @param path
	 */
	async delete(path: string): Promise<void> {
		try {
			await this.plugin.app.vault.adapter.remove(path);
		} catch (ignore) {
			// Silently fail
		}
	}

	private registerIgnorePatternChangeHandler() {
		this.plugin.events.on(
			"IGNORE_PATTERN:CHANGED",
			"VaultManager",
			async () => {
				await this.buildIndex();
				log("Rebuilt index", this.index);
			}
		);
	}

	private registerFileChangeHandlers() {
		this.plugin.app.vault.on("create", async (file) => {
			if (file instanceof TFile) {
				await this.updateHandler(file as TFile);
			}
		});

		this.plugin.app.vault.on("delete", async (file) => {
			if (file instanceof TFile) {
				await this.deleteHandler(file.path);
			}
		});

		this.plugin.app.vault.on("modify", async (file) => {
			if (file instanceof TFile) {
				await this.updateHandler(file as TFile);
			}
		});

		this.plugin.app.vault.on("rename", async (file, oldPath) => {
			if (file instanceof TFile) {
				await this.renameHandler(oldPath, file as TFile);
			}
		});
	}

	private async updateHandler(updated: TFile) {
		if (this.ignoreHandler.isIgnored(updated.path)) return;

		// Compare with OneDrive index
		const oneDriveIndex = this.plugin.settings.of((s) => s.oneDriveIndex);
		if (oneDriveIndex[updated.path]?.stat.mtime !== updated.stat.mtime) {
			this.index.toUpload[updated.path] = await this.toIndexItem(updated);
		}
	}

	private async deleteHandler(path: string) {
		if (this.ignoreHandler.isIgnored(path)) return;

		if (this.index.toUpload[path]) {
			delete this.index.toUpload[path];
		}

		if (this.plugin.settings.of((s) => s.oneDriveIndex[path])) {
			this.index.toDelete.add(path);
		}
	}

	private async renameHandler(fromPath: string, renamed: TFile) {
		// Handle old path
		await this.deleteHandler(fromPath);

		// Handle new path
		await this.updateHandler(renamed);
	}

	private toIndexItem(file: TFile) {
		return {
			name: file.name,
			path: file.path,
			stat: {
				type: "file",
				ctime: file.stat.ctime,
				mtime: file.stat.mtime,
				size: file.stat.size,
			},
		} as TIndexItem;
	}
}
