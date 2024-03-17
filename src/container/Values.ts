/**
 * @ Author: Hanrea
 * @ version: 2022-03-21 13:14:21
 * @ copyright: Vecmat (c) - <hi(at)vecmat.com>
 */
import lodash from "lodash";
import { TAGGED_ARGS } from "./IContainer.js";
import { RecursiveGetMetadata } from "./Util.js";
import { Exception, Check } from "@vecmat/vendor";
import { Container, IOCContainer } from "./Container.js";

/**
 * Inject class instance property
 *
 * @export
 * @param {*} target
 * @param {*} instance
 * @param {Container} [container]
 */
export function injectValues(target: any, instance: any, container?: Container) {
    const metaData = RecursiveGetMetadata(TAGGED_ARGS, target);
    // tslint:disable-next-line: forin
    for (const metaKey in metaData) {
        const { name, method } = metaData[metaKey];
        Reflect.defineProperty(instance, name, {
            enumerable: true,
            configurable: false,
            writable: true,
            value: lodash.isFunction(method) ? <Function>method() : method ?? undefined
        });
    }
}

/**
 * Indicates that an decorated class instance property values.
 *
 * @export
 * @param {any | Function} val
 * @param {unknown} [defaultValue]
 * @returns {*}  {PropertyDecorator}
 */
export function Values(val: any | Function, defaultValue?: unknown): PropertyDecorator {
    return (target: Object, propertyKey: string | symbol) => {
        const paramTypes = Reflect.getMetadata("design:type", target, propertyKey);
        const types = paramTypes.name ? paramTypes.name : "object";
        IOCContainer.savePropertyData(
            TAGGED_ARGS,
            {
                name: propertyKey,
                method: function () {
                    let value = val;
                    if (lodash.isFunction(val)) {
                        value = val();
                    }
                    if (defaultValue !== undefined) {
                        value = Check.isTrueEmpty(value) ? defaultValue : value;
                    }
                    if (typeof value !== types) {
                        throw new Exception(
                            "BOOTERR_BOUNDVAL_TYPEERR",
                            "The type of the value is not the same as the type of the parameter"
                        );
                    }
                    return value;
                }
            },
            target,
            propertyKey
        );
    };
}
