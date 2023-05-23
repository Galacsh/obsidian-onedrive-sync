import OdsPlugin from "src/main";

export default class IgnoreHandler {
	private ignorePatterns: RegExp[];

	constructor(private plugin: OdsPlugin) {
		this.ignorePatterns = this.loadIgnorePatterns();
	}

	isIgnored(path: string) {
		return this.ignorePatterns.some((pattern) => pattern.test(path));
	}

	getIgnorePatterns() {
		return this.ignorePatterns;
	}

	updateIgnorePatterns() {
		this.ignorePatterns = this.loadIgnorePatterns();
		this.plugin.events.fire("IGNORE_PATTERN:CHANGED");
	}

	private loadIgnorePatterns() {
		return this.plugin.settings
			.of((s) => s.ignore)
			.filter((s) => s != null && s !== "")
			.map((s) => new RegExp(s));
	}
}
