/**
 * @ Author: Hanrea
 * @ version: 2022-03-21 13:14:21
 * @ copyright: Vecmat (c) - <hi(at)vecmat.com>
 */
import { IService, IMethod } from "protobufjs";
import { OptionType } from "./interface";

const EMPTY = "google.protobuf.Empty";

/**
 *
 *
 * @param {string} name
 * @param {{
 *     [k: string]: IMethod;
 *   }} content
 * @returns {*}
 */
function readMethod(
    name: string,
    content: {
        [k: string]: IMethod;
    }
) {
    const params = Object.keys(content).map(paramName => {
        const paramValue = content[paramName];

        return { name: paramName, ...paramValue };
    });

    return {
        category: "methods",
        name,
        params
    };
}

/**
 *
 *
 * @export
 * @param {string} name
 * @param {IService} methodContent
 * @param {OptionType} options
 * @returns {*}
 */
export function printMethod(name: string, methodContent: IService, options: OptionType) {
    const content = methodContent.methods;
    const item = readMethod(name, content);

    const arrs = item.params.map(param => {
        const requestType = param.requestType === EMPTY ? "" : param.requestType;
        const responseType = param.responseType === EMPTY ? "any" : param.responseType;

        return {
            name: param.name,
            requestType,
            responseType
        };
    });

    return arrs;
}
