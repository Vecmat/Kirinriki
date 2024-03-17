/**
 * @ Author: Hanrea
 * @ version: 2022-03-21 13:14:21
 * @ copyright: Vecmat (c) - <hi(at)vecmat.com>
 */
import { IEnum } from "protobufjs";
import { OptionType } from "./interface.js";

/**
 *
 *
 * @export
 * @param {string} name
 * @param {IEnum} enumContent
 * @param {OptionType} options
 * @returns {*}
 */
export function printEnum(name: string, enumContent: IEnum, options: OptionType) {
    const content = enumContent.values;
    const item = Object.keys(content)
        .map(key => ({
            name: key,
            id: content[key]||0
        }))
        .sort((a, b) => a.id - b.id);
    const arr = item.map(s => `  ${s.name} = "${s.id}",`);
    return {
        name,
        fields: arr
    };
}
