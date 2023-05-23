/**
 * Decode base64 string.
 *
 * @param base64 The base64 string to decode.
 * @returns The decoded string.
 */
export const decode = (base64: string | null) => {
	if (!base64) return null;
	return Buffer.from(base64, "base64").toString("utf8");
};

/**
 * Encode string to base64.
 *
 * @param str The string to encode.
 * @returns The encoded string.
 */
export const encode = (str: string | null) => {
	if (!str) return null;
	return Buffer.from(str, "utf8").toString("base64");
};
