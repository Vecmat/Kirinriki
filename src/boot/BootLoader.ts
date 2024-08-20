/**
 * @ Author: Hanrea
 * @ version: 2022-03-21 13:14:21
 * @ copyright: Vecmat (c) - <hi(at)vecmat.com>
*/
import lodash from "lodash";
import { IAddon } from "../base/Addon.js";
import { LoadDir } from "../base/Loader.js";
import { Captor } from "../base/Capturer.js";
import { LoggerOption } from "@vecmat/printer";
import { checkClass } from "../vendor/widget.js";
import { AppReadyHookFunc } from "./Bootstrap.js";
import { Kirinriki } from "../core/Application.js";
import { BaseController } from "../base/Controller.js";
import { updateLogger, Logger } from "../base/Logger.js";
import { IOCContainer } from "../container/Container.js";
import { ARROBJ, Check, Exception } from "@vecmat/vendor";
import { LoadConfigs as loadConf } from "../base/config.js";
import { TAGGED_CLS, ComponentType } from "../container/IContainer.js";
import { COMPONENT_SCAN, CONFIGURATION_SCAN, APP_READY_HOOK, CAPTURER_KEY } from "../base/Constants.js";
import { ACTION_SCOPT } from "../router/define.js"
import path from "path";
import { fileURLToPath } from "url";
/**
 *
 *
 * @interface ComponentItem
 */
export interface ComponentItem {
    id: string
    target: any
}

/**
 *
 */
export class BootLoader {
    /**
     * initialize env
     *
     * @static
     * @param {Kirinriki} app
     * @memberof BootLoader
     */
    public static initialize(app: Kirinriki) {
        const env = (process.execArgv ?? []).join(",");
        // app.env
        app.env = process.env.KRNRK_ENV || process.env.NODE_ENV || "";
        if (env.indexOf("--production") > -1 || (app.env ?? "").indexOf("pro") > -1) {
            app.appDebug = false;
        }
        if (env.indexOf("ts-node") > -1 || env.indexOf("--debug") > -1) {
            app.appDebug = true;
        }
        // set mode
        if (app.appDebug) {
            app.env = "development";
            process.env.NODE_ENV = "development";
            process.env.APP_DEBUG = "true";
        } else {
            app.env = "production";
            process.env.NODE_ENV = "production";
        }

        // define path
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);

        const rootPath = app.rootPath || process.cwd();
        const appPath = app.appPath || path.resolve(rootPath, env.indexOf("ts-node") > -1 ? "src" : "dist");
        const krnrkPath = path.resolve(__dirname, "..");

        process.env.APP_PATH = appPath;
        process.env.ROOT_PATH = rootPath;
        process.env.THINK_PATH = krnrkPath;

        ARROBJ.defineProp(app, "appPath", appPath);
        ARROBJ.defineProp(app, "rootPath", rootPath);
        ARROBJ.defineProp(app, "krnrkPath", krnrkPath);
    }

    /**
     * Get component metadata
     *
     * @static
     * @param {Kirinriki} app
     * @param {*} target
     * @returns {*}  {any[]}
     * @memberof BootLoader
     */
    public static GetComponentMetas(app: Kirinriki, target: any): any[] {
        let componentMetas = [];
        const componentMeta = IOCContainer.getClassMetadata(TAGGED_CLS, COMPONENT_SCAN, target);
        if (componentMeta) {
            if (lodash.isArray(componentMeta)) {
                componentMetas = componentMeta;
            } else {
                componentMetas.push(componentMeta);
            }
        }
        if (componentMetas.length < 1) {
            componentMetas = [app.appPath];
        }
        return componentMetas;
    }

    /**
     * Load all bean, excepted config/*、App.ts
     *
     * @static
     * @param {Kirinriki} app
     * @param {*} target
     * @memberof BootLoader
     */
    public static async CheckAllComponents(app: Kirinriki, target: any) {
        // component metadata
        const componentMetas = BootLoader.GetComponentMetas(app, target);
        // configuration metadata
        const configurationMetas = BootLoader.GetConfigurationMetas(app, target);
        const exSet = new Set();
        await LoadDir(
            componentMetas,
            "",
            (fileName: string, xpath: string, xTarget: any) => {
                checkClass(fileName, xpath, xTarget, exSet);
            },
            ["**/**.js", "**/**.cjs", "**/**.mjs", "**/**.ts", "!**/**.d.ts"],
            [...configurationMetas, `${target.name || ".no"}.ts`]
        );
        exSet.clear();
    }

    /**
     * Get configuration metadata
     *
     * @static
     * @param {Kirinriki} app
     * @param {*} target
     * @returns {*}  {any[]}
     * @memberof BootLoader
     */
    public static GetConfigurationMetas(app: Kirinriki, target: any): any[] {
        const confMeta = IOCContainer.getClassMetadata(TAGGED_CLS, CONFIGURATION_SCAN, target);
        let configurationMetas = [];
        if (confMeta) {
            if (lodash.isArray(confMeta)) {
                configurationMetas = confMeta;
            } else {
                configurationMetas.push(confMeta);
            }
        }
        return configurationMetas;
    }

    /**
     * Set Logger level
     *
     * @static
     * @param {Kirinriki} app
     * @memberof BootLoader
     */
    public static SetLogger(app: Kirinriki) {
        const configs = app.getMetaData("_configs") ?? {};
        //Logger
        if (configs.logger) {
            const opt = configs.logger as LoggerOption;
            // pro env setting
            if (app.env === "production") {
                // opt.File.level = "info";

                opt.output?.delete("Console");
            }
            updateLogger(opt);
        }
    }

    /**
     * Load app ready hook funcs
     *
     * @static
     * @param {Kirinriki} app
     * @param {*} target
     * @memberof BootLoader
     */
    public static LoadAppReadyHooks(app: Kirinriki, target: any) {
        const funcs = IOCContainer.getClassMetadata(TAGGED_CLS, APP_READY_HOOK, target);
        if (lodash.isArray(funcs)) {
            funcs.forEach((element: AppReadyHookFunc): any => {
                app.once("APP_BOOT_FINISH", () => element(app));
                return null;
            });
        }
    }

    /**
     * Load configuration
     *
     * @static
     * @param {Kirinriki} app
     * @param {string[]} [loadPath]
     * @memberof BootLoader
     */
    public static async LoadConfigs(app: Kirinriki, target: any) {
        const frameConfig: any = {};
        let loadPath = BootLoader.GetConfigurationMetas(app, target);
        Logger.Debug(`Load configuration path: ${app.krnrkPath}/config`);
        await LoadDir(["./config"], app.krnrkPath, function (name: string, path: string, exp: any) {
            frameConfig[name] = exp;
        });
        if (lodash.isArray(loadPath)) {
            loadPath = loadPath.length > 0 ? loadPath : ["./config"];
        }
        let appConfig = await loadConf(loadPath, app.appPath);
        appConfig = ARROBJ.extendObj(frameConfig, appConfig, true);
        app.setMetaData("_configs", appConfig);
    }

    /**
     * Load Captor
     *
     * @static
     * @param {*} app
     * @memberof BootLoader
     */
    public static async loadCaptor(app: Kirinriki) {
        await LoadDir(["./Capturer"], app.appPath);
        Logger.Debug(`Load core Captor: ${app.appPath}/Capturer`);
        const clsList = IOCContainer.listClass("CAPTURER");
        clsList.forEach((item: ComponentItem) => {
            item.id = (item.id ?? "").replace("CAPTURER:", "");
            const ins = IOCContainer.reg(item.id, item.target, { scope: "Prototype", type: "CAPTURER", args: [] });
            const keyMeta = IOCContainer.listPropertyData(CAPTURER_KEY, item.target);
            for (const fun in keyMeta) {
                if (lodash.isFunction(ins[fun])) {
                    Captor.reg(keyMeta[fun], ins[fun]);
                }
            }
        });

        // load other capturer
        Logger.Debug(`Load other Captor!`);
        app.once("APP_BOOT_FINISH", async () => {
            const allcls = IOCContainer.listClass();
            allcls.forEach((item: ComponentItem) => {
                if ((item.id ?? "").startsWith("CAPTURER")) return;
                const [, type, name] = item.id.match(/(\S+):(\S+)/) || [];
                if (!name || !type) {
                    console.error(`[Kirinriki] CAPTURER :"${item.id}"‘s name format error!`);
                    return;
                }
                const ins = IOCContainer.get(name, <ComponentType>type);
                const keyMeta = IOCContainer.listPropertyData(CAPTURER_KEY, item.target);
                for (const fun in keyMeta) {
                    if (lodash.isFunction(ins[fun])) {
                        Captor.reg(keyMeta[fun], ins[fun]);
                    }
                }
            });
        });
    }

    /**
     * Load addons
     *
     * @static
     * @param {*} app
     * @memberof BootLoader
     */
    public static async LoadAddons(app: Kirinriki) {
        const componentList = IOCContainer.listClass("ADDON");

        let addonConf = app.config(undefined, "addon");
        if (Check.isEmpty(addonConf)) {
            addonConf = { config: {}, queue: [] };
        }

        // 全部的插件
        const addonList = [];
        // 循环加载
        componentList.forEach(async (item: ComponentItem) => {
            item.id = (item.id ?? "").replace("ADDON:", "");
            if (item.id && item.id.endsWith("Addon") && Check.isClass(item.target)) {
                // registering to IOC
                IOCContainer.reg(item.id, item.target, { scope: "Singleton", type: "ADDON", args: [] });
                addonList.push(item.id);
            }
        });

        const addonConfQueue = addonConf.queue;

        for (const key of addonConfQueue) {
            const ins: IAddon = IOCContainer.get(key, "ADDON");
            console.log(ins.version);
        }
    }

    /**
     * Load mixture
     *
     * @static
     * @param {*} app
     * @memberof BootLoader
     */
    public static LoadMixtures(app: Kirinriki) {
        const mixtureList = IOCContainer.listClass("ACTION");
        mixtureList.forEach((item: ComponentItem) => {
            item.id = (item.id ?? "").replace("MIXTURE:", "");
            if (item.id && Check.isClass(item.target)) {
                Logger.Debug(`Load mixture: ${item.id}`);
                // registering to IOC
                const scope = IOCContainer.getClassMetadata(ACTION_SCOPT, "scope", item.target);
                IOCContainer.reg(item.id, item.target, { scope: scope, type: "ACTION", args: [] });
            }
        });
    }

    /**
     * Load components
     *
     * @static
     * @param {*} app
     * @memberof BootLoader
     */
    public static LoadComponents(app: Kirinriki) {
        const componentList = IOCContainer.listClass("COMPONENT");
        componentList.forEach((item: ComponentItem) => {
            item.id = (item.id ?? "").replace("COMPONENT:", "");
            if (item.id && !item.id.endsWith("Plugin") && Check.isClass(item.target)) {
                Logger.Debug(`Load component: ${item.id}`);
                // registering to IOC
                IOCContainer.reg(item.id, item.target, { scope: "Singleton", type: "COMPONENT", args: [] });
            }
        });
    }

    /**
     * Load controllers
     *
     * @static
     * @param {*} app
     * @memberof BootLoader
     */
    public static LoadControllers(app: Kirinriki) {
        const controllerList = IOCContainer.listClass("CONTROLLER");

        const controllers: string[] = [];
        controllerList.forEach((item: ComponentItem) => {
            item.id = (item.id ?? "").replace("CONTROLLER:", "");
            if (item.id && Check.isClass(item.target)) {
                Logger.Debug(`Load controller: ${item.id}`);
                // registering to IOC
                IOCContainer.reg(item.id, item.target, { scope: "Prototype", type: "CONTROLLER", args: [] });
                const ctl = IOCContainer.getInsByClass(item.target);
                if (!(ctl instanceof BaseController)) {
                    throw new Exception("BOOTERR_LOADER_UNSUITED", `class ${item.id} does not inherit from BaseController`);
                }
                controllers.push(item.id);
            }
        });
        return controllers;
    }
}
