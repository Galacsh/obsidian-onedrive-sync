import { Notice } from "obsidian";

import {
	TEventType,
	TEventCallback,
	TEventArgs,
	TEventSubscriber,
} from "./types";

const getLogger = () => {
	if (process.env.NODE_ENV === "development") {
		// @ts-ignore
		return (...data) => console.log("[OneDrive Sync]", ...data);
	} else {
		return () => {};
	}
};

export const log = getLogger();

export class OneDriveSyncNotice extends Notice {
	constructor(message: string, timeout = 0) {
		super(`OneDrive Sync - ${message}`, timeout);
	}
}

export class PluginEvents {
	private readonly events: Record<
		TEventType,
		Partial<Record<TEventSubscriber, TEventCallback>>
	>;

	constructor() {
		this.events = {
			"AUTH:SIGN_IN": {},
			"AUTH:SIGN_OUT": {},
		};
	}

	on(
		eventType: TEventType,
		subscriber: TEventSubscriber,
		callback: TEventCallback
	) {
		this.events[eventType][subscriber] = callback;
	}

	remove(eventType: TEventType, subscriber: TEventSubscriber) {
		this.events[eventType][subscriber] = undefined;
	}

	fire(eventType: TEventType, ...data: TEventArgs) {
		const subs = Object.keys(this.events[eventType]) as TEventSubscriber[];
		for (const subscriber of subs) {
			const callback = this.events[eventType][subscriber];
			if (callback) {
				log(`Firing event ${eventType} to ${subscriber}`);
				callback(...data);
			}
		}
	}
}
