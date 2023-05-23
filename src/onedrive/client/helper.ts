import {
	request,
	requestUrl,
	RequestUrlParam,
	RequestUrlResponse,
} from "obsidian";

import {
	TDeleteMethodParams,
	TGetMethodParams,
	TPostMethodParams,
	TPutMethodParams,
	TPutMethodParamsWithContentInfo,
} from "./types";
import * as c from "./constants";

/**
 * Request and get a body.
 */
const req = async (url: string | RequestUrlParam) => {
	const response = await request(url);
	return JSON.parse(response);
};

/**
 * Request and get a full response.
 */
const reqFull = async (
	url: string | RequestUrlParam
): Promise<RequestUrlResponse> => {
	return requestUrl(url);
};

/**
 * Replace a key in a string with a value.
 * The replaced value is encoded with encodeURI.
 *
 * @param str String to replace in
 * @param key Key to replace
 * @param value Value to replace with
 */
const replace = (str: string, key: string, value: string) =>
	encodeURI(str.replace(key, value));

/**
 * Links in the response body.
 */
export const links = {
	next: "@odata.nextLink",
	delta: "@odata.deltaLink",
	download: "@microsoft.graph.downloadUrl",
};

/**
 * URIs for the OneDrive API.
 */
export const uris = {
	consentManage: c.URI_CONSENT_MANAGE,
	root: c.APP_ROOT,
	rootChildren: c.APP_ROOT_CHILDREN,

	// Path based
	byPath: (path: string) => replace(c.BY_PATH, c.ITEM_PATH, path),
	childrenByPath: (path: string) =>
		replace(c.BY_PATH_CHILDREN, c.ITEM_PATH, path),
	deltaByPath: (path: string) => replace(c.BY_PATH_DELTA, c.ITEM_PATH, path),
	downloadLinkByPath: (path: string) =>
		replace(c.BY_PATH_DOWNLOAD, c.ITEM_PATH, path),
	contentByPath: (path: string) =>
		replace(c.BY_PATH_CONTENT, c.ITEM_PATH, path),
	createUploadSessionByPath: (path: string) =>
		replace(c.BY_PATH_CREATE_UPLOAD_SESSION, c.ITEM_PATH, path),

	// ID based
	byId: (id: string) => c.BY_ID.replace(c.ITEM_ID, id),
	childrenById: (id: string) => c.BY_ID_CHILDREN.replace(c.ITEM_ID, id),
	deltaById: (id: string) => c.BY_ID_DELTA.replace(c.ITEM_ID, id),
	downloadLinkById: (id: string) => c.BY_ID_DOWNLOAD.replace(c.ITEM_ID, id),
	contentById: (id: string) => c.BY_ID_CONTENT.replace(c.ITEM_ID, id),

	// Delta token
	deltaToken: (token: string) => c.BY_DELTA.replace(c.DELTA_TOKEN, token),
};

/**
 * Shortcuts for the methods.
 */
export const methods = {
	get: async ({ url, accessToken }: TGetMethodParams) =>
		await req({
			url: url,
			method: "GET",
			contentType: "application/json",
			headers: {
				Authorization: `Bearer ${accessToken}`,
				"Cache-Control": "no-cache",
			},
		}),
	getFull: async ({ url }: TGetMethodParams) =>
		await reqFull({
			url: url,
			headers: {
				"Cache-Control": "no-cache",
			},
		}),
	post: async ({ url, accessToken, body }: TPostMethodParams) =>
		await req({
			url: url,
			method: "POST",
			contentType: "application/json",
			headers: {
				Authorization: `Bearer ${accessToken}`,
			},
			body: body,
		}),
	put: async ({ url, accessToken, body }: TPutMethodParams) =>
		await fetch(url, {
			method: "PUT",
			headers: {
				Authorization: `Bearer ${accessToken}`,
				"Content-Type": "application/octet-stream",
			},
			body: body,
		}),
	putContentInfoNoAuth: async ({
		url,
		contentLength,
		contentRange,
		body,
	}: TPutMethodParamsWithContentInfo) =>
		await fetch(url, {
			method: "PUT",
			headers: {
				"Content-Length": contentLength,
				"Content-Range": contentRange,
				"Content-Type": "application/octet-stream",
			},
			body: body,
		}),
	delete: async ({ url, accessToken }: TDeleteMethodParams) =>
		await req({
			url: url,
			method: "DELETE",
			headers: {
				Authorization: `Bearer ${accessToken}`,
			},
		}),
	deleteFull: async ({ url, accessToken }: TDeleteMethodParams) =>
		await reqFull({
			url: url,
			method: "DELETE",
			headers: {
				Authorization: `Bearer ${accessToken}`,
			},
		}),
};
