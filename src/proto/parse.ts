/**
 * @ Author: Hanrea
 * @ version: 2022-03-21 13:14:21
 * @ copyright: Vecmat (c) - <hi(at)vecmat.com>
 */
import protobufjs, { IService, IType, IEnum, Root } from "protobufjs";
import { printEnum } from "./enum";
import { printField } from "./field";
import { OptionType } from "./interface";
import { printMethod } from "./method";

/**
 * defaultOptions
 *
 * @interface OptionType
 */
const defaultOptions: OptionType = {
    isDefinition: false
};

/**
 * parseProto
 *
 * @export
 * @param {string} source
 * @returns {protobufjs.INamespace}
 */
export function parseProto(source: string): protobufjs.INamespace {
    const res = protobufjs.parse(source, { keepCase: true });
    return parseProtoRoot(res.root, res.package);
}

/**
 * parseMethods
 *
 * @export
 * @param {protobufjs.INamespace} json
 * @param {OptionType} [options]
 * @returns {object}
 */
export function parseMethods(json: protobufjs.INamespace, options?: OptionType): object {
    if (!options) options = defaultOptions;

    const nested = json.nested;
    const res: any = {};
    if (nested) {
        for (const name in nested) {
            if (Object.prototype.hasOwnProperty.call(nested, name)) {
                const value = nested[name];
                Object.keys(value).map(category => {
                    if (category === "methods") res[name] = printMethod(name, value as IService, options);

                    if (category === "nested") res[name] = parseMethods(value, options);
                });
            }
        }
    }
    return res;
}

/**
 * parseFields
 *
 * @export
 * @param {protobufjs.INamespace} json
 * @param {OptionType} [options]
 * @returns {object}
 */
export function parseFields(json: protobufjs.INamespace, options?: OptionType): object {
    if (!options) options = defaultOptions;

    const nested = json.nested;
    const res: any = {};
    if (nested) {
        for (const name in nested) {
            if (Object.prototype.hasOwnProperty.call(nested, name)) {
                const value = nested[name];
                Object.keys(value).map(category => {
                    if (category === "fields") res[name] = printField(name, value as IType, options);

                    if (category === "nested") res[name] = parseFields(value, options);
                });
            }
        }
    }
    return res;
}

/**
 * parseValues
 *
 * @export
 * @param {protobufjs.INamespace} json
 * @param {OptionType} [options]
 * @returns {object}
 */
export function parseValues(json: protobufjs.INamespace, options?: OptionType): object {
    if (!options) options = defaultOptions;

    const nested = json.nested;
    const res: any = {};
    if (nested) {
        for (const name in nested) {
            if (Object.prototype.hasOwnProperty.call(nested, name)) {
                const value = nested[name];
                Object.keys(value).map(category => {
                    if (category === "values") res[name] = printEnum(name, value as IEnum, options);

                    if (category === "nested") res[name] = parseValues(value, options);
                });
            }
        }
    }
    return res;
}

/**
 *
 *
 * @export
 * @param {Root} root
 * @param {OptionType} options
 * @param {string} [packageName]
 * @returns {protobufjs.INamespace}
 */
export function parseProtoRoot(root: Root, packageName?: string): any {
    if (packageName) {
        const _root = root.lookup(packageName);
        return _root?.toJSON();
    }
    return root.toJSON();
}
