/**
 * @ Author: Hanrea
 * @ version: 2022-03-21 13:14:21
 * @ copyright: Vecmat (c) - <hi(at)vecmat.com>
 */
import { OptionType } from "./interface.js";
import { IType, IField, IMapField } from "protobufjs";

const TYPES: {
    [key: string]: string;
} = {
    double: "number",
    float: "number",
    int32: "number",
    int64: "string",
    uint32: "number",
    uint64: "string",
    sint32: "number",
    sint64: "string",
    fixed32: "number",
    fixed64: "string",
    sfixed32: "number",
    sfixed64: "string",
    bool: "boolean",
    string: "string",
    bytes: "string"
};

/**
 *
 *
 * @param {Partial<IMapField>} p
 * @returns {*}
 */
function getKeyType(p: Partial<IMapField>) {
    if (p.keyType) return TYPES[p.keyType] || p.keyType;

    return "";
}

/**
 *
 *
 * @param {string} name
 * @param {{
 *     [k: string]: IField;
 *   }} content
 * @returns {*}
 */
function readField(
    name: string,
    content: {
        [k: string]: IField;
    }
) {
    const params = Object.keys(content).map(paramName => {
        const paramValue = content[paramName];
        if (!paramValue) {
            throw new Error("Kirinriki:GRPC readField of null content");
        }
        return {
            type: TYPES[paramValue.type] || paramValue.type,
            keyType: getKeyType(paramValue),
            name: paramName,
            rule: paramValue.rule,
            id: paramValue.id
        };
    });

    return {
        category: "fields",
        name,
        params: params.sort((a, b) => a.id - b.id)
    };
}

/**
 *
 *
 * @export
 * @param {string} name
 * @param {IType} fieldParams
 * @param {OptionType} options
 * @returns {*}
 */
export function printField(name: string, fieldParams: IType, options: OptionType) {
    const content = fieldParams.fields;

    const item = readField(name, content);

    const arrs = item.params.map(param => {
        if (param.rule === "repeated") return `  ${param.name}: ${param.type}[];`;

        if (param.keyType) return `  ${param.name}: {[key: ${param.keyType}]: ${param.type}};`;

        return `  ${param.name}: ${param.type};`;
    });

    // if (fieldParams.nested) {
    //   Object.keys(fieldParams.nested).forEach(key => {
    //     strs.push(`  ${key}: ${key};\n`);
    //   });
    // }

    return {
        name: item.name,
        fields: arrs
    };
}
