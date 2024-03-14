/**
 * @ Author: Hanrea
 * @ version: 2022-03-21 13:14:21
 * @ copyright: Vecmat (c) - <hi(at)vecmat.com>
 */


import { Kirinriki } from "../core";
export { LoggerOption } from "@vecmat/printer";
import { DefaultLogger, LoggerOption } from "@vecmat/printer";
import { VMLogger } from "@vecmat/printer";

// Export
export let Logger = DefaultLogger;

/**
 * Set an customize Logger
 *
 * @export
 * @param {Printer} ins
 */
export async function SetLogger(ins: VMLogger) {
    Logger = ins;
}

/**
 * updateLogger
 *
 * @export
 * @param {LoggerOption} config
 */
export function updateLogger(config:LoggerOption) {
    DefaultLogger.update(config);
}
