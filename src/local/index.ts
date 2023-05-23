import { Stat, Vault } from "obsidian";

import { TIndexedFiles, TIndexItem } from "src/types";

export default class LocalVault {
	constructor(private vault: Vault) {}

	async toIndexItem(path: string): Promise<TIndexItem> {
		return {
			name: path.split("/").pop() as string,
			path,
			stat: await this.getStat(path),
		};
	}

	async getStat(path: string): Promise<Stat> {
		return (await this.vault.adapter.stat(path)) as Stat;
	}

	/**
	 * Get all files in the vault.
	 * Filter out files that match the ignore patterns.
	 *
	 * @returns object of indexed files.
	 */
	async getAllFiles(
		ignorePatterns: RegExp[] = [],
		basePath = "/"
	): Promise<TIndexedFiles> {
		const result = {} as TIndexedFiles;
		// Get all files from the root folder
		await this.getFiles(ignorePatterns, basePath, result);
		return result;
	}

	/**
	 * Recursively get all files in the vault.
	 * Filter out files that match the ignore patterns.
	 *
	 * @param ignorePatterns Patterns to ignore
	 * @param basePath Base path to start from
	 * @param result Object to store the result
	 * @private
	 */
	private async getFiles(
		ignorePatterns: RegExp[],
		basePath: string,
		result: TIndexedFiles
	): Promise<void> {
		// Get files and folders
		const { files, folders } = await this.vault.adapter.list(basePath);

		// Append to result if not ignored
		for (const file of files) {
			if (!ignorePatterns.some((pattern) => pattern.test(file))) {
				result[file] = {
					name: file.split("/").pop() as string,
					path: file,
					stat: (await this.vault.adapter.stat(file)) as Stat,
				};
			}
		}

		// Recursively get files from sub-folders if not ignored
		for (const folder of folders) {
			if (!ignorePatterns.some((pattern) => pattern.test(folder))) {
				await this.getFiles(ignorePatterns, folder, result);
			}
		}
	}

	async write(item: TIndexItem, content: ArrayBuffer) {
		if (item.stat?.type === "folder") return;

		const folder = item.path.split("/").slice(0, -1).join("/");
		await this.createFolderIfAbsent(folder);
		await this.vault.adapter.writeBinary(item.path, content, {
			ctime: item.stat?.ctime,
			mtime: item.stat?.mtime,
		});
	}

	async createFolderIfAbsent(path: string) {
		const isFolder = await this.vault.adapter.exists(path);
		if (!isFolder) await this.vault.createFolder(path);
	}

	async read(path: string) {
		return await this.vault.adapter.readBinary(path);
	}
}
