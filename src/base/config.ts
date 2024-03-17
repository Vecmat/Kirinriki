
import rc from "rc";
import lodash from "lodash";
import { LoadDir } from "./Loader.js";
import { Check, IObject } from "@vecmat/vendor";
import { IOCContainer } from "../container/Container.js";
import { TAGGED_ARGS } from "../container/IContainer.js";

/**
 * LoadConfigs
 *
 * @export
 * @param {string[]} loadPath
 * @param {string} [baseDir]
 * @param {string[]} [pattern]
 * @param {string[]} [ignore]
 * @returns {*}
 */
export async function LoadConfigs(loadPath: string[], baseDir?: string, pattern?: string[], ignore?: string[]) {
    const conf: any = {};
    const env = process.env.KIRINRIKI_ENV || process.env.NODE_ENV || "";
    await LoadDir(
        loadPath,
        baseDir,
        (name: string, path: string, exp: any) => {
            let tempConf: any = {};
            if (name.includes("_")) {
                const t = name.slice(name.lastIndexOf("_") + 1);
                if (t && env.indexOf(t) === 0) {
                    name = name.replace(`_${t}`, "");
                    tempConf = rc(name, { [name]: parseEnv(exp) });
                }
            } else {
                tempConf = rc(name, { [name]: parseEnv(exp) });
            }
            conf[name] = tempConf[name];
        },
        pattern,
        ignore
    );

    return conf;
}




/**
 * parse process.env to replace ${}
 *
 * @param {*} conf
 * @returns {*}
 */
function parseEnv(conf: IObject) {
    if (!lodash.isObject(conf)) return conf;
    for (const key in conf) {
        if (conf.hasOwnProperty(key)) {
            const element = conf[key];
            if (lodash.isObject(element)) {
                conf[key] = parseEnv(element);
            } else {
                if (typeof element == "string") {
                    if (element.startsWith("${") && element.endsWith("}")) {
                        const value = process.env[element.slice(2, -1)];
                        if (!Check.isTrueEmpty(value)) conf[key] = value;
                        else conf[key] = "";
                    }
                }
            }
        }
    }
    return conf;
}

/**
 * Indicates that an decorated configuration as a property.
 *
 * @export
 * @param {string} identifier configuration key
 * @param {string} [type] configuration type
 * @returns {PropertyDecorator}
 */
export function Config(key?: string | symbol, type?: string): PropertyDecorator {
    return (target: Object, propertyKey: string | symbol) => {
        const app = IOCContainer.getApp();
        if (!app || !app.config) return;

        // identifier = identifier || STR.camelCase(propertyKey, { pascalCase: true });
        key = key || propertyKey;
        type = type || "config";
        IOCContainer.savePropertyData(
            TAGGED_ARGS,
            {
                name: propertyKey,
                method() {
                    return app.config(key, type);
                }
            },
            target,
            propertyKey
        );
    };
}
/**
 * Indicates that an decorated configuration as a property.
 *
 * @deprecated use `Config` instead
 * @param {string} identifier configuration key
 * @param {string} [type] configuration type
 * @returns {PropertyDecorator}
 */
export const Value = Config;
