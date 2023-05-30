import { TSettings } from "src/types";

const DEFAULT_SETTINGS: TSettings = {
	deltaLink: null,
	oneDriveIndex: {},
	ignore: ["\\.obsidian\\/plugins\\/onedrive-sync\\/data\\.json", "\\.git"],
};

export default DEFAULT_SETTINGS;
