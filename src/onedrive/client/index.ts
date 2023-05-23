import { DriveItem } from "@microsoft/microsoft-graph-types";

import { links, methods, uris } from "./helper";
import AuthProvider from "../auth";
import { getTotalChunks } from "./utils";

// constants for uploading large files
const UNIT = 327680; // 320 KB
export const CHUNK_SIZE = UNIT * 150; // 48 MB

export default class OneDriveClient {
	private readonly auth: AuthProvider;

	constructor(auth: AuthProvider) {
		this.auth = auth;
	}

	/**
	 * Get latest delta link.
	 *
	 * @returns Latest delta link.
	 */
	async getLatestDelta() {
		try {
			const response = await methods.get({
				url: uris.root + "/delta?token=latest",
				accessToken: await this.auth.acquireToken(),
			});
			return response[links.delta];
		} catch (e) {
			throw new DriveError("NO_DELTA_LINK", "Failed to get delta link.");
		}
	}

	/**
	 * Get list of files/folders in the path.
	 *
	 * @param path Path to search.
	 * @returns List of files/folders.
	 */
	async listChildrenByPath(path: string) {
		try {
			return await methods.get({
				url: uris.childrenByPath(path),
				accessToken: await this.auth.acquireToken(),
			});
		} catch (e) {
			throw new DriveError(
				"NO_ITEM_FOUND",
				"Failed to find file by path and delete it."
			);
		}
	}

	/**
	 * Get item by id.
	 *
	 * @param id ID of the item.
	 * @returns The item.
	 */
	async getItemById(id: string) {
		try {
			return await methods.get({
				url: uris.byId(id),
				accessToken: await this.auth.acquireToken(),
			});
		} catch (e) {
			throw new DriveError("NO_ITEM_FOUND", "Failed to get item by ID.");
		}
	}

	/**
	 * Get item by path.
	 *
	 * @param path Path to the item.
	 * @returns The item.
	 */
	async getItemByPath(path: string) {
		try {
			return await methods.get({
				url: uris.byPath(path),
				accessToken: await this.auth.acquireToken(),
			});
		} catch (e) {
			throw new DriveError(
				"NO_ITEM_FOUND",
				"Failed to get item by path."
			);
		}
	}

	/**
	 * Create a root folder
	 *
	 * @param rootFolderName Name of the root folder to create.
	 * @returns The created folder.
	 */
	async createRootFolder(rootFolderName: string) {
		try {
			return await methods.post({
				url: uris.rootChildren,
				accessToken: await this.auth.acquireToken(),
				body: JSON.stringify({
					name: rootFolderName,
					folder: {},
					"@microsoft.graph.conflictBehavior": "replace",
				}),
			});
		} catch (e) {
			throw new DriveError(
				"CREATE_FOLDER_FAIL",
				"Failed to create folder."
			);
		}
	}

	/**
	 * Create a folder by path.
	 *
	 * @param path Full path of the folder to create.
	 * @returns The created folder.
	 */
	async createFolder(path: string) {
		try {
			const parts = path.split("/");
			const parentPath = parts.slice(0, -1).join("/");
			const folderName = parts[parts.length - 1];

			return await methods.post({
				url: uris.childrenByPath(parentPath),
				accessToken: await this.auth.acquireToken(),
				body: JSON.stringify({
					name: folderName,
					folder: {},
					"@microsoft.graph.conflictBehavior": "replace",
				}),
			});
		} catch (e) {
			throw new DriveError(
				"CREATE_FOLDER_FAIL",
				"Failed to create folder."
			);
		}
	}

	/**
	 * Delete a file/folder by path.
	 *
	 * @param path The path of the file/folder to delete.
	 */
	async deleteByPath(path: string) {
		try {
			return await methods.deleteFull({
				url: uris.byPath(path),
				accessToken: await this.auth.acquireToken(),
			});
		} catch (e) {
			throw new DriveError(
				"NO_ITEM_FOUND",
				"Failed to delete file by path."
			);
		}
	}

	/**
	 * Delete a file/folder by id.
	 *
	 * @param id The id of the file/folder to delete.
	 */
	async deleteById(id: string) {
		try {
			return await methods.delete({
				url: uris.byId(id),
				accessToken: await this.auth.acquireToken(),
			});
		} catch (e) {
			throw new DriveError(
				"NO_ITEM_FOUND",
				"Failed to delete file by ID."
			);
		}
	}

	/**
	 * Download a file by path.
	 *
	 * @param path Path of the file
	 * @returns File content
	 */
	async downloadByPath(path: string) {
		try {
			const downloadLink = await this.downloadLinkByPath(path);
			const res = await methods.getFull({
				url: downloadLink,
			});
			return res.arrayBuffer;
		} catch (e) {
			throw new DriveError(
				"NO_ITEM_FOUND",
				"Failed to download file by path."
			);
		}
	}

	/**
	 * Download a file by item ID.
	 *
	 * @param id Item ID
	 * @returns File content
	 */
	async downloadById(id: string) {
		try {
			const downloadLink = await this.downloadLinkById(id);
			const res = await methods.getFull({
				url: downloadLink,
			});
			return res.arrayBuffer;
		} catch (e) {
			throw new DriveError(
				"NO_ITEM_FOUND",
				"Failed to download file by ID."
			);
		}
	}

	/**
	 * Upload a file which is smaller than 4MB.
	 *
	 * @param file File to upload
	 * @param pathToUpload Path on OneDrive to upload
	 * @returns Upload result
	 */
	async uploadByPath(file: Uint8Array, pathToUpload: string) {
		try {
			const uploadResult = await methods.put({
				url: uris.contentByPath(pathToUpload),
				accessToken: await this.auth.acquireToken(),
				body: file,
			});
			return uploadResult;
		} catch (e) {
			throw new DriveError(
				"UPLOAD_FILE_FAIL",
				"Failed to upload file by path."
			);
		}
	}

	/**
	 * Upload a file which is larger than 4MB.
	 *
	 * @param file File to upload
	 * @param pathToUpload Path on OneDrive to upload
	 * @param size Size of the file
	 * @param onProgressUpdate Callback function to notify progress
	 * @returns Upload result
	 */
	async uploadLargeFile(
		file: Uint8Array,
		pathToUpload: string,
		size: number,
		onProgressUpdate?: (current: number, total: number) => void
	) {
		try {
			const totalChunks = getTotalChunks(size);
			const uploadSession = await this.createUploadSession(pathToUpload);
			const url = uploadSession.uploadUrl;

			// upload chunks
			const responses = [];
			for (let i = 0; i < totalChunks; i++) {
				const start = i * CHUNK_SIZE;
				const end = Math.min(start + CHUNK_SIZE, size);

				// upload chunk
				if (onProgressUpdate) onProgressUpdate(i + 1, totalChunks);
				const res = await methods.putContentInfoNoAuth({
					url: url,
					contentLength: `${end - start}`,
					contentRange: `bytes ${start}-${end - 1}/${size}`,
					body: file.subarray(start, end),
				});
				responses.push(await res.json());
			}
			return responses;
		} catch (e) {
			throw new DriveError(
				"UPLOAD_FILE_FAIL",
				"Failed to upload large file by path."
			);
		}
	}

	/**
	 * Gets the latest delta response from OneDrive.
	 *
	 * @returns The list of files and delta link.
	 */
	async trackChanges(basePath: string) {
		let items = [] as DriveItem[];

		// get the first page
		let res = await this.deltaByPath(basePath);
		items = items.concat(res.value);

		// get the rest of the pages
		while (res[links.next]) {
			res = await this.getLinkResponse(res[links.next]);
			items = items.concat(res.value);
		}

		return { items, deltaLink: res[links.delta] as string };
	}

	/**
	 * Track changes using a delta link.
	 *
	 * @param deltaLink The delta link to use.
	 * @returns The list of files and delta link.
	 */
	async trackChangesByDeltaLink(deltaLink: string) {
		let items = [] as DriveItem[];

		// get the first page
		let res = await this.getLinkResponse(deltaLink);
		items = items.concat(res.value);

		// get the rest of the pages
		while (res[links.next]) {
			res = await this.getLinkResponse(res[links.next]);
			items = items.concat(res.value);
		}

		// to IOneDriveDelta
		return { items, deltaLink: res[links.delta] };
	}

	/**
	 * Get the download link of a file which is in the path on OneDrive.
	 *
	 * @param path Path of the file
	 * @returns Download link
	 */
	private async downloadLinkByPath(path: string) {
		try {
			const res = await methods.get({
				url: uris.downloadLinkByPath(path),
				accessToken: await this.auth.acquireToken(),
			});
			return res["@microsoft.graph.downloadUrl"];
		} catch (e) {
			throw new DriveError(
				"NO_ITEM_FOUND",
				"Failed to get download link by path."
			);
		}
	}

	/**
	 * Get download link of a file having a given ID.
	 *
	 * @param id Item ID
	 * @returns Download link
	 */
	private async downloadLinkById(id: string) {
		try {
			const res = await methods.get({
				url: uris.downloadLinkById(id),
				accessToken: await this.auth.acquireToken(),
			});
			return res["@microsoft.graph.downloadUrl"];
		} catch (e) {
			throw new DriveError(
				"NO_ITEM_FOUND",
				"Failed to get download link by ID."
			);
		}
	}

	/**
	 * Creates an upload session for a large file.
	 *
	 * @param path The path of the file to upload.
	 * @returns The upload session.
	 */
	private async createUploadSession(path: string) {
		return await methods.post({
			url: uris.createUploadSessionByPath(path),
			accessToken: await this.auth.acquireToken(),
			body: JSON.stringify({
				item: {
					"@microsoft.graph.conflictBehavior": "replace",
				},
			}),
		});
	}

	/**
	 * Gets the delta response of item in a path from OneDrive.
	 *
	 * @param path The path to get the delta response from.
	 * @returns The delta response.
	 */
	private async deltaByPath(path: string) {
		return await methods.get({
			url: uris.deltaByPath(path),
			accessToken: await this.auth.acquireToken(),
		});
	}

	/**
	 * Gets the response of a link.
	 *
	 * @param link The link to get the response from.
	 * @returns The response.
	 */
	private async getLinkResponse(link: string) {
		return await methods.get({
			url: link,
			accessToken: await this.auth.acquireToken(),
		});
	}
}

export class DriveError extends Error {
	private short: string;

	constructor(short: string, message: string) {
		super(message);
		this.name = "DriveError";
		this.short = short;
	}

	toString() {
		return `${this.short}: ${this.message}`;
	}
}
