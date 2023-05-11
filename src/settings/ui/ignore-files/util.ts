/**
 * Checks if the patterns are valid.
 *
 * @param patterns patterns to be checked
 * @returns true if all patterns are valid, false otherwise
 */
export function isEveryPatternValid(patterns: string[]) {
	let isValid = true;
	for (let i = 0; i < patterns.length; i++) {
		if (!isValidPattern(patterns[i])) {
			isValid = false;
			break;
		}
	}
	return isValid;
}

/**
 * Checks if the pattern is valid.
 *
 * @param pattern pattern to be checked
 * @returns true if the pattern is valid, false otherwise
 */
function isValidPattern(pattern: string) {
	try {
		new RegExp(pattern);
		return true;
	} catch (e) {
		return false;
	}
}
