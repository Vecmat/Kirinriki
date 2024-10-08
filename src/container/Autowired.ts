/**
 * @ Author: Hanrea
 * @ version: 2022-03-21 13:14:21
 * @ copyright: Vecmat (c) - <hi(at)vecmat.com>
 */
// tslint:disable-next-line: no-import-side-effect

import { STR, Exception } from "@vecmat/vendor";
import { RecursiveGetMetadata } from "./Util.js";
import { IOCContainer, Container } from "./Container.js";
import { ComponentType, TAGGED_PROP } from "./IContainer.js";


/**
 * Marks a constructor method as to be autowired by Kirinriki"s dependency injection facilities.
 *
 * @export
 * @param {string} [identifier]
 * @param {ComponentType} [type]
 * @param {any[]} [constructArgs]
 * @param {boolean} [isDelay=false]
 * @returns {PropertyDecorator}
 */
export function Autowired(identifier?: string, type?: ComponentType, constructArgs?: any[], isDelay = false): PropertyDecorator {
    return (target: Object, propertyKey: string | symbol) => {
        const designType = Reflect.getMetadata("design:type", target, propertyKey);
        if (!identifier) {
            if (!designType || designType.name === "Object") {
                identifier = STR.camelCase(propertyKey as string, true);
            } else {
                identifier = designType.name;
            }
        }
        if (!identifier) {
            throw new Exception("BOOTERR_DEPRO_MISSATTR", "identifier cannot be empty when circular dependency exists");
        }
        if (type === undefined) {
           if (identifier.indexOf("Action") > -1) {
               type = "ACTION";
           } else if (identifier.indexOf("Addon") > -1) {
               type = "ADDON";
           } else if (identifier.indexOf("Capturer") > -1) {
               type = "CAPTURER";
           } else if (identifier.indexOf("Controller") > -1) {
               type = "CONTROLLER";
           } else {
               type = "COMPONENT";
           }
        }
        //Cannot rely on injection controller
        if (type === "CONTROLLER") {
            throw new Exception("BOOTERR_DEPRO_UNSUITED", `Controller cannot be injection!`);
        }

        if (!designType || designType.name === "Object") {
            isDelay = true;
        }

        IOCContainer.savePropertyData(
            TAGGED_PROP,
            {
                type,
                identifier,
                delay: isDelay,
                args: constructArgs ?? []
            },
            target,
            propertyKey
        );
    };
}


/**
 * inject autowired class
 *
 * @export
 * @param {*} target
 * @param {*} instance
 * @param {Container} container
 * @param {boolean} [isLazy=false]
 */
export function injectAutowired(target: any, instance: any, container: Container, isLazy = false) {
    const metaData = RecursiveGetMetadata(TAGGED_PROP, target);
    // tslint:disable-next-line: forin
    for (const metaKey in metaData) {
        let dep;
        const { type, identifier, delay, args } = metaData[metaKey] || { type: "", identifier: "", delay: false, args: [] };
        if (type && identifier) {
            if (!delay || isLazy) {
                dep = container.get(identifier, type, args);
                if (dep) {
                    // logger.Debug(`Register inject ${target.name} properties key: ${metaKey} => value: ${JSON.stringify(metaData[metaKey])}`);
                    Reflect.defineProperty(instance, metaKey, {
                        enumerable: true,
                        configurable: false,
                        writable: true,
                        value: dep
                    });
                } else {
                    throw new Exception("BOOTERR_INJECT_NOTFOUND",`Component ${metaData[metaKey].identifier ?? ""} not found. It's autowired in class ${target.name}`);
                }
            } else {
                // Delay loading solves the problem of cyclic dependency
                const app = container.getApp();
                app.once("APP_BOOT_FINISH", () => {
                    // lazy inject autowired
                    injectAutowired(target, instance, container, true);
                });
            }
        }
    }
}
