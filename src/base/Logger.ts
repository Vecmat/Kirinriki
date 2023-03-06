/**
 * @ Author: Hanrea
 * @ version: 2022-03-21 13:14:21
 * @ copyright: Vecmat (c) - <hi(at)vecmat.com>
 */


import { Kirinriki } from "../core";
import { DefaultLogger, LoggerOption } from "@vecmat/printer";


// Export Logger
export const Logger = DefaultLogger;
export {LoggerOption} from "@vecmat/printer";
/**
 * SetLogger
 *
 * @export
 * @param {LoggerOption} config
 */
export function SetLogger(app: Kirinriki, config:LoggerOption) {
    // 更新配置？
    DefaultLogger.update(config);
}
