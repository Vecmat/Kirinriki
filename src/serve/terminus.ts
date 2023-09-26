/**
 * @ Author: Hanrea
 * @ version: 2022-03-21 13:14:21
 * @ copyright: Vecmat (c) - <hi(at)vecmat.com>
 */

import lodash from "lodash";
import EventEmitter from "events";
import { IApplication } from "../core";
import { Logger } from "../base/Logger";
import { asyncEmit } from "../vendor/eve";

/** @type {*} */
const terminusOptions = {
    signals: ["SIGINT", "SIGTERM"],
    // cleanup options
    timeout: 60000, // [optional = 1000] number of milliseconds before forceful exiting
    onSignal // [optional] cleanup function, returning a promise (used to be onSigterm)
};

export interface TerminusOptions {
    timeout: number;
    signals?: string[];
    onSignal?: (event: string, server: IApplication, forceTimeout: number) => Promise<any>;
}

/**
 * Create terminus event
 *
 * @export
 * @param {(Server | Http2SecureServer)} server
 * @param {TerminusOptions} [options]
 */
export function CreateTerminus(server: IApplication, options?: TerminusOptions): void {
    const opt = { ...terminusOptions, ...options };
    for (const event of opt.signals) {
        process.on(event, () => {
            opt.onSignal(event, server, opt.timeout);
        });
    }
}
// processEvent
type processEvent = "beforeExit" | "exit" | NodeJS.Signals;
/**
 * Bind event to the process
 *
 * @param {EventEmitter} event
 * @param {string} originEventName
 * @param {string} [targetEventName]
 */

export function BindProcessEvent(event: EventEmitter, originEventName: string, targetEventName: processEvent = "beforeExit") {
    const ls: Function[] = event.listeners(originEventName);
    for (const func of ls) {
        if (lodash.isFunction(func)) {
            process.addListener(<any>targetEventName, <NodeJS.SignalsListener>func);
        }
    }
    return event.removeAllListeners(originEventName);
}


/**
 * cleanup function, returning a promise (used to be onSigterm)
 *
 * @returns {*}
 */
async function onSignal(event: string, server: IApplication, forceTimeout: number) {
    Logger.Warn(`Received kill signal (${event}), shutting down...`);
    server.status = 503;
    await asyncEmit(process, "beforeExit");
    // Don't bother with graceful shutdown in development
    if (!process.env.NODE_ENV || process.env.NODE_ENV === "development") {
        return process.exit(0);
    }

    setTimeout(() => {
        Logger.Error("Could not close connections in time, forcefully shutting down");
        process.exit(1);
    }, forceTimeout);

    server.Stop(() => {
        Logger.Warn("Closed out remaining connections");
        process.exit(0);
    });
}
