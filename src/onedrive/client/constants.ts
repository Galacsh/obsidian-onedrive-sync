export const GRAPH = "https://graph.microsoft.com/v1.0/me/drive";
export const APP_ROOT = `${GRAPH}/special/approot`;
export const APP_ROOT_CHILDREN = `${APP_ROOT}/children`;

export const URI_CONSENT_MANAGE = "https://account.live.com/consent/Manage";

// Using item path
export const ITEM_PATH = "{{ITEM_PATH}}";
export const BY_PATH = `${APP_ROOT}:/${ITEM_PATH}`;
export const BY_PATH_CHILDREN = `${BY_PATH}:/children`;
export const BY_PATH_DELTA = `${BY_PATH}:/delta`;
export const BY_PATH_DOWNLOAD = `${BY_PATH}?select=id,@microsoft.graph.downloadUrl`;
export const BY_PATH_CONTENT = `${BY_PATH}:/content`;
export const BY_PATH_CREATE_UPLOAD_SESSION = `${APP_ROOT}:/{{ITEM_PATH}}:/createUploadSession`;

// Using item ID
export const ITEM_ID = "{{ITEM_ID}}";
export const BY_ID = `${APP_ROOT}/items/${ITEM_ID}`;
export const BY_ID_CHILDREN = `${BY_ID}/children`;
export const BY_ID_DELTA = `${BY_ID}/delta`;
export const BY_ID_DOWNLOAD = `${BY_ID}?select=id,@microsoft.graph.downloadUrl`;
export const BY_ID_CONTENT = `${BY_ID}/content`;

// Using delta token
export const DELTA_TOKEN = "{{DELTA_TOKEN}}";
export const BY_DELTA = `${APP_ROOT}/delta?token=${DELTA_TOKEN}`;
