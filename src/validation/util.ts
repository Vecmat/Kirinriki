/**
 * @ Author: Hanrea
 * @ version: 2022-03-21 13:14:21
 * @ copyright: Vecmat (c) - <hi(at)vecmat.com>
 */
// tslint:disable-next-line: no-import-side-effect

import lodash from "lodash";
import { Check } from "@vecmat/vendor";
import { PARAM_TYPE_KEY } from "./rule.js";
import { getOriginMetadata } from "../container/Util.js";

/**
 * Set property as included in the process of transformation.
 *
 * @export
 * @param {Object} object
 * @param {(string | symbol)} propertyName
 */
export function setExpose(object: Object, propertyName: string | symbol) {
    const types = Reflect.getMetadata("design:type", object, propertyName);
    if (types) {
        const originMap = getOriginMetadata(PARAM_TYPE_KEY, object);
        originMap.set(propertyName, types.name);
    }
}

const functionPrototype = Object.getPrototypeOf(Function);
// get property of an object
// https://tc39.github.io/ecma262/#sec-ordinarygetprototypeof
function ordinaryGetPrototypeOf(obj: any): any {
    const proto = Object.getPrototypeOf(obj);
    if (typeof obj !== "function" || obj === functionPrototype)
        return proto;

    // TypeScript doesn't set __proto__ in ES5, as it's non-standard.
    // Try to determine the superclass constructor. Compatible implementations
    // must either set __proto__ on a subclass constructor to the superclass constructor,
    // or ensure each class has a valid `constructor` property on its prototype that
    // points back to the constructor.

    // If this is not the same as Function.[[Prototype]], then this is definitely inherited.
    // This is the case when in ES6 or when using __proto__ in a compatible browser.
    if (proto !== functionPrototype)
        return proto;

    // If the super prototype is Object.prototype, null, or undefined, then we cannot determine the heritage.
    const prototype = obj.prototype;
    const prototypeProto = prototype && Object.getPrototypeOf(prototype);
    // tslint:disable-next-line: triple-equals
    if (prototypeProto === undefined || prototypeProto === Object.prototype)
        return proto;

    // If the constructor was not a function, then we cannot determine the heritage.
    const constructor = prototypeProto.constructor;
    if (typeof constructor !== "function")
        return proto;

    // If we have some kind of self-reference, then we cannot determine the heritage.
    if (constructor === obj)
        return proto;

    // we have a pretty good guess at the heritage.
    return constructor;
}

/**
 * get property metadata data
 *
 * @param {(string | symbol)} decoratorNameKey
 * @param {*} target
 * @returns
 */
function listPropertyData(decoratorNameKey: string | symbol, target: any, propertyKey: string | symbol) {
    const originMap = getOriginMetadata(decoratorNameKey, target, propertyKey);
    const data: any = {};
    for (const [key, value] of originMap)
        data[key] = value;

    return data;
}

/**
 * get metadata value of a metadata key on the prototype chain of an object and property
 * @param metadataKey metadata key
 * @param target the target of metadataKey
 */
export function recursiveGetMetadata(metadataKey: any, target: any, propertyKey: string | symbol): any[] {
    // get metadata value of a metadata key on the prototype
    // let metadata = Reflect.getOwnMetadata(metadataKey, target, propertyKey);
    const metadata = listPropertyData(metadataKey, target, propertyKey) || {};

    // get metadata value of a metadata key on the prototype chain
    let parent = ordinaryGetPrototypeOf(target);
    while (parent !== null) {
        // metadata = Reflect.getOwnMetadata(metadataKey, parent, propertyKey);
        const pMetadata = listPropertyData(metadataKey, parent, propertyKey);
        if (pMetadata) {
            for (const n in pMetadata) {
                if (!Object.hasOwnProperty.call(metadata, n))
                    metadata[n] = pMetadata[n];
            }
        }
        parent = ordinaryGetPrototypeOf(parent);
    }
    return metadata;
}

/**
 * Dynamically add methods for target class types
 *
 * @param {Function} clazz
 * @param {string} protoName
 * @param {Function} func
 */
export function defineNewProperty(clazz: Function, protoName: string, func: Function) {
    const oldMethod = Reflect.get(clazz.prototype, protoName);
    if (oldMethod) {
        Reflect.defineProperty(clazz.prototype, protoName, {
            writable: true,
            value: function fn(...props: any[]) {
                // process paramter
                props = func(props);
                // tslint:disable-next-line: no-invalid-this
                return Reflect.apply(oldMethod, this, props);
            },
        });
    }
}

/**
 *
 *
 * @export
 * @param {*} clazz
 * @param {*} data
 * @param {boolean} [convert=false]
 * @returns
 */
export function plainToClass(clazz: any, data: any, convert = false) {
    if (Check.isClass(clazz)) {
        let cls;
        if (!lodash.isObject(data))
            data = {};

        if (data instanceof clazz)
            cls = data;
        else
            cls = Reflect.construct(clazz, []);

        if (convert)
            return convertDtoParamsType(clazz, cls, data);

        return Object.assign(cls, data);
    }
    return data;
}

/**
 * convertDtoParamsType
 *
 * @param {*} clazz
 * @param {*} cls
 * @param {*} data
 * @returns {*}
 */
export function convertDtoParamsType(clazz: any, cls: any, data: any) {
    if (Object.prototype.hasOwnProperty.call(cls, "_typeDef")) {
        for (const key in cls) {
            if (Object.prototype.hasOwnProperty.call(data, key)
                && Object.prototype.hasOwnProperty.call(cls._typeDef, key))
                data[key] = convertParamsType(data[key], cls._typeDef[key]);
        }
    } else {
        const originMap = getOriginMetadata(PARAM_TYPE_KEY, clazz);
        for (const [key, type] of originMap) {
            if (key && Object.prototype.hasOwnProperty.call(data, key))
                cls[key] = convertParamsType(data[key], type);
        }
    }
    return cls;
}

/**
 * 绑定参数类型转换
 *
 * @param {*} param
 * @param {string} type
 * @returns {*}
 */
export function convertParamsType(param: any, type: string) {
    try {
        switch (type) {
            case "Number":
            case "number":
                if (lodash.isNaN(param))
                    return NaN;

                if (lodash.isNumber(param))
                    return param;

                if (Check.isNumberString(param))
                    return lodash.toNumber(param);

                return NaN;
            case "Boolean":
            case "boolean":
                return !!param;
            case "Array":
            case "array":
            case "Tuple":
            case "tuple":
                if (lodash.isArray(param))
                    return param;

                return lodash.toArray(param);
            case "String":
            case "string":
                if (lodash.isString(param))
                    return param;

                return lodash.toString(param);
            case "Null":
            case "null":
                return null;
            case "Undefined":
            case "undefined":
                return undefined;
            case "Bigint":
            case "bigint":
                if (typeof param === "bigint")
                    return param;

                return BigInt(param);
            // case "object":
            // case "enum":
            default: // any
                return param;
        }
    } catch (err) {
        return param;
    }
}

/**
 * Check the base types.
 *
 * @param {*} value
 * @param {string} type
 * @returns {*}
 */
export function checkParamsType(value: any, type: string): any {
    switch (type) {
        case "Number":
        case "number":
            if (!lodash.isNumber(value) || lodash.isNaN(value)) return false;

            return true;
        case "Boolean":
        case "boolean":
            if (!lodash.isBoolean(value)) return false;

            return true;
        case "Array":
        case "array":
        case "Tuple":
        case "tuple":
            if (!lodash.isArray(value))
                return false;

            return true;
        case "String":
        case "string":
            if (!lodash.isString(value))
                return false;

            return true;
        case "Object":
        case "object":
        case "Enum":
        case "enum":
            if (Check.isTrueEmpty(value))
                return false;

            return true;
        case "Null":
        case "null":
            if (!lodash.isNull(value))
                return false;

            return true;
        case "Undefined":
        case "undefined":
            if (!lodash.isUndefined(value)) return false;
            return true;
        case "Bigint":
        case "bigint":
            if (typeof value !== "bigint")
                return false;

            return true;
        default: // any
            return true;
    }
}

/**
 * Checks if value is a chinese name.
 *
 * @param {string} value
 * @returns {boolean}
 */
export function cnName(value: string): boolean {
    const reg = /^([a-zA-Z0-9\u4E00-\u9FA5\·]{1,10})$/;
    return reg.test(value);
}

/**
 * Checks if value is a idCard number.
 *
 * @param {string} value
 * @returns
 */
export function idNumber(value: string): boolean {
    if (/^\d{15}$/.test(value))
        return true;

    if ((/^\d{17}[0-9X]$/).test(value)) {
        const vs = "1,0,x,9,8,7,6,5,4,3,2".split(",");
        const ps: any[] = "7,9,10,5,8,4,2,1,6,3,7,9,10,5,8,4,2".split(",");
        const ss: any[] = value.toLowerCase().split("");
        let r = 0;
        for (let i = 0; i < 17; i++)
            r += ps[i] * ss[i];

        const isOk = (vs[r % 11] === ss[17]);
        return isOk;
    }
    return false;
}

/**
 * Checks if value is a mobile phone number.
 *
 * @param {string} value
 * @returns {boolean}
 */
export function mobile(value: string): boolean {
    const reg = /^(13|14|15|16|17|18|19)\d{9}$/;
    return reg.test(value);
}

/**
 * Checks if value is a zipCode.
 *
 * @param {string} value
 * @returns {boolean}
 */
export function zipCode(value: string): boolean {
    const reg = /^\d{6}$/;
    return reg.test(value);
}

/**
 * Checks if value is a plateNumber.
 *
 * @param {string} value
 * @returns {boolean}
 */
export function plateNumber(value: string): boolean {
    // let reg = new RegExp('^(([\u4e00-\u9fa5][a-zA-Z]|[\u4e00-\u9fa5]{2}\d{2}|[\u4e00-\u9fa5]{2}[a-zA-Z])[-]?|([wW][Jj][\u4e00-\u9fa5]{1}[-]?)|([a-zA-Z]{2}))([A-Za-z0-9]{5}|[DdFf][A-HJ-NP-Za-hj-np-z0-9][0-9]{4}|[0-9]{5}[DdFf])$');
    // let xReg = /^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领A-Z]{1}[A-Z]{1}(([0-9]{5}[DF]$)|([DF][A-HJ-NP-Z0-9][0-9]{4}$))/;
    const xReg = /^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领]{1}[A-Z]{1}(([0-9]{5}[DF]$)|([DF][A-HJ-NP-Z0-9][0-9]{4}$))/;
    // let cReg = /^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领A-Z]{1}[A-Z]{1}[A-HJ-NP-Z0-9]{4}[A-HJ-NP-Z0-9挂学警港澳]{1}$/;
    const cReg = /^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领]{1}[A-Z]{1}[A-HJ-NP-Z0-9]{4}[A-HJ-NP-Z0-9挂学警港澳]{1}$/;
    if (value.length === 7) {
        return cReg.test(value);
    } else {
        // 新能源车牌
        return xReg.test(value);
    }
}
