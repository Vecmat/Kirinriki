/**
 * @ Author: Hanrea
 * @ version: 2022-03-21 13:14:21
 * @ copyright: Vecmat (c) - <hi(at)vecmat.com>
 */


import { VMLogger } from "@vecmat/printer";
import { DefaultLogger } from "@vecmat/printer";
import type { LoggerOption } from "@vecmat/printer";

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
