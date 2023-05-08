import { Stat } from "obsidian";

// ================
// Settings Related
// ================

export type TSettingsExtractor<T> = (data: TSettings) => T;
export type TSettingsUpdater = (data: TSettings) => void;

export interface ISettingsManager {
	get: () => TSettings;
	of: <T>(extractor: TSettingsExtractor<T>) => T;
	update: (updater: TSettingsUpdater) => Promise<void>;
	init: () => Promise<ISettingsManager>;
}

export type TIndexItem = {
	name: string;
	path: string;
	stat: Stat;
};
export type TIndex = {
	[filePath: string]: TIndexItem;
};
export type TSettings = {
	deltaLink: string | null;
	index: TIndex;
	ignore: string[];
};
