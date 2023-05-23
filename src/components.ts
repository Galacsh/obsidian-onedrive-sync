import { Notice } from "obsidian";

import {
	TEventArgs,
	TEventCallback,
	TEventSubscriber,
	TEventType,
} from "./types";

/**
 * Returns a logger by checking the environment variable.
 */
const getLogger = () => {
	if (process.env.NODE_ENV === "development") {
		// @ts-ignore
		return (...data) => console.log("[OneDrive Sync]", ...data);
	} else {
		return () => {};
	}
};

/**
 * A logger that logs to the console if the environment is development.
 */
export const log = getLogger();

/**
 * A notice that will not be hidden until it's clicked
 * or a timeout is specified and reached.
 */
export class OneDriveSyncNotice extends Notice {
	private readonly PREFIX = "OneDrive Sync -";

	constructor(message: string, timeout = 0) {
		super(`OneDrive Sync - ${message}`, timeout);
	}

	setMessage(message: string): this {
		return super.setMessage(`${this.PREFIX} ${message}`);
	}

	hideAfter(timeout: number) {
		setTimeout(() => this.hide(), timeout);
	}
}

/**
 * A class to manage plugin events.
 */
export class PluginEvents {
	private readonly events: Record<
		TEventType,
		Partial<Record<TEventSubscriber, TEventCallback>>
	>;

	constructor() {
		this.events = {
			"AUTH:SIGN_IN": {},
			"AUTH:SIGN_OUT": {},
			"IGNORE_PATTERN:CHANGED": {},
		};
	}

	/**
	 * Subscribe to an event.
	 *
	 * @param eventType Event type to subscribe to.
	 * @param subscriber Subscriber name.
	 * @param callback Callback to execute when the event is fired.
	 */
	on(
		eventType: TEventType,
		subscriber: TEventSubscriber,
		callback: TEventCallback
	) {
		this.events[eventType][subscriber] = callback;
	}

	/**
	 * Unsubscribe from an event.
	 *
	 * @param eventType
	 * @param subscriber
	 */
	remove(eventType: TEventType, subscriber: TEventSubscriber) {
		this.events[eventType][subscriber] = undefined;
	}

	/**
	 * Fire an event.
	 *
	 * @param eventType Event type to fire.
	 * @param data Data to pass to the event callback.
	 */
	fire(eventType: TEventType, ...data: TEventArgs) {
		const subs = Object.keys(this.events[eventType]) as TEventSubscriber[];
		for (const subscriber of subs) {
			const callback = this.events[eventType][subscriber];
			if (callback) callback(...data);
		}
	}

	/**
	 * Clear all event subscriptions.
	 */
	clear() {
		const eventTypes = Object.keys(this.events) as TEventType[];
		for (const eventType of eventTypes) {
			this.events[eventType] = {};
		}
	}
}
