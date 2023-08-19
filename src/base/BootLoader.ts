/**
 * @ Author: Hanrea
 * @ version: 2022-03-21 13:14:21
 * @ copyright: Vecmat (c) - <hi(at)vecmat.com>
*/
import lodash from "lodash";
import * as path from "path";
import { LoadDir } from "./Loader";
import { Kirinriki } from '../core';
import { Captor  } from "./Capturer";
import { checkClass } from "./widget";
import { AppReadyHookFunc } from "./Bootstrap";
import { LoadConfigs as loadConf } from "./config";
import { MIXTURE_SCOPT } from "../router/mapping";
import { BaseController } from "./BaseController";
import { ISavant, IPlugin } from './Component';
import { Logger, SetLogger, LoggerOption } from "./Logger";
import { TraceSavant } from "../savant/TraceSavant";
import { Exception, Check, ARROBJ } from "@vecmat/vendor";
import { PayloadSavant } from "../savant/PayloadSavant";
import { ComponentType, IOCContainer, TAGGED_CLS } from "../container";
import { APP_READY_HOOK, CAPTURER_KEY, COMPONENT_SCAN, CONFIGURATION_SCAN } from './Constants';


/**
 *
 *
 * @interface ComponentItem
 */
interface ComponentItem {
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
        app.env = process.env.KRNRK_ENV || process.env.NODE_ENV;
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
    public static CheckAllComponents(app: Kirinriki, target: any) {
        // component metadata
        const componentMetas = BootLoader.GetComponentMetas(app, target);
        // configuration metadata
        const configurationMetas = BootLoader.GetConfigurationMetas(app, target);
        const exSet = new Set();
        LoadDir(
            componentMetas,
            "",
            (fileName: string, xpath: string, xTarget: any) => {
                checkClass(fileName, xpath, xTarget, exSet);
            },
            ["**/**.js", "**/**.ts", "!**/**.d.ts"],
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
            const opt = <LoggerOption>configs.logger;
            // pro env setting
            if (app.env === "production") {
                opt.File.level = "info";
                opt.output.delete("Console");
            }
            SetLogger(app, opt);
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
                app.once("appReady", () => element(app));
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
    public static LoadConfigs(app: Kirinriki, loadPath?: string[]) {
        const frameConfig: any = {};
        // Logger.Debug(`Load configuration path: ${app.krnrkPath}/config`);
        LoadDir(["./config"], app.krnrkPath, function (name: string, path: string, exp: any) {
            frameConfig[name] = exp;
        });

        if (lodash.isArray(loadPath)) {
            loadPath = loadPath.length > 0 ? loadPath : ["./config"];
        }
        let appConfig = loadConf(loadPath, app.appPath);
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
    public static loadCaptor(app: Kirinriki) {
        LoadDir(["./Capturer"], app.krnrkPath);
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

        // 获取函数并注入到Captor map
        // $ 是否可以加载全部错误拦截？
        // 获取所有class，然后解析所有的 CAPTURER_KEY 并注入
        app.once("appReady", async () => {
            const allcls = IOCContainer.listClass();
            allcls.forEach((item: ComponentItem) => {
                if ((item.id ?? "").startsWith("CAPTURER")) return;
                // 动态获取类型
                const [, type, name] = item.id.match(/(\S+):(\S+)/);
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
     * Load savants
     * [async]
     * @static
     * @param {*} app
     * @param {(string | string[])} [loadPath]
     * @memberof BootLoader
     */
    public static async LoadSavants(app: Kirinriki, loadPath?: string[]) {
        let savantConf = app.config(undefined, "savant");
        if (lodash.isEmpty(savantConf)) {
            savantConf = { config: {}, list: [] };
        }

        // Mount default savant
        LoadDir(loadPath || ["./Savant"], app.krnrkPath);
        // Mount application savant
        // const savant: any = {};
        const appSavant = IOCContainer.listClass("SAVANT") ?? [];

        appSavant.push({ id: "TraceSavant", target: TraceSavant });
        appSavant.push({ id: "PayloadSavant", target: PayloadSavant });
        appSavant.forEach((item: ComponentItem) => {
            item.id = (item.id ?? "").replace("SAVANT:", "");
            if (item.id && Check.isClass(item.target)) {
                IOCContainer.reg(item.id, item.target, { scope: "Prototype", type: "SAVANT", args: [] });
            }
        });

        const savantConfList = savantConf.list;

        // todo ？如何加载 @vecmat/svant
        //de-duplication
        // ! 必须排在最前面
        const defaultList = ["TraceSavant", "PayloadSavant"];
        const appSavantList = new Set(defaultList);
        savantConfList.forEach((item: string) => {
            if (!defaultList.includes(item)) {
                appSavantList.add(item);
            }
        });

        // ! ? 似乎没控制顺序？
        // Automatically call savant
        for (const key of appSavantList) {
            const handle: ISavant = IOCContainer.get(key, "SAVANT");
            if (!handle) {
                Logger.Error(`Savant ${key} load error.`);
                continue;
            }
            if (!lodash.isFunction(handle.run)) {
                Logger.Error(`Savant ${key} must be implements method 'run'.`);
                continue;
            }
            if (savantConf.config[key] === false) {
                // Default savant cannot be disabled
                if (defaultList.includes(key)) {
                    Logger.Warn(`Savant ${key} cannot be disabled.`);
                } else {
                    Logger.Warn(`Savant ${key} already loaded but not effective.`);
                    continue;
                }
            }
            Logger.Debug(`Load savant: ${key}`);
            const result = await handle.run(savantConf.config[key] || {}, app);
            if (lodash.isFunction(result)) {
                if (result.length < 3) {
                    app.use(result);
                } else {
                    app.useExp(result);
                }
            }
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
        const mixtureList = IOCContainer.listClass("MIXTURE");
        mixtureList.forEach((item: ComponentItem) => {
            item.id = (item.id ?? "").replace("MIXTURE:", "");
            if (item.id && Check.isClass(item.target)) {
                Logger.Debug(`Load mixture: ${item.id}`);
                // registering to IOC
                const scope = IOCContainer.getClassMetadata(MIXTURE_SCOPT, "scope", item.target);
                IOCContainer.reg(item.id, item.target, { scope: scope, type: "MIXTURE", args: [] });
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
    public static LoadAspects(app: Kirinriki) {
        const aspectList = IOCContainer.listClass("ASPECT");
        aspectList.forEach((item: ComponentItem) => {
            item.id = (item.id ?? "").replace("COMPONENT:", "");
            if (item.id && !item.id.endsWith("Plugin") && Check.isClass(item.target)) {
                Logger.Debug(`Load component: ${item.id}`);
                // registering to IOC
                IOCContainer.reg(item.id, item.target, { scope: "Singleton", type: "COMPONENT", args: [] });
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

    /**
     * Load plugins
     *
     * @static
     * @param {*} app
     * @memberof BootLoader
     */
    public static async LoadPlugins(app: Kirinriki) {
        const componentList = IOCContainer.listClass("COMPONENT");

        let pluginsConf = app.config(undefined, "plugin");
        if (Check.isEmpty(pluginsConf)) {
            pluginsConf = { config: {}, list: [] };
        }

        const pluginList = [];
        componentList.forEach(async (item: ComponentItem) => {
            item.id = (item.id ?? "").replace("COMPONENT:", "");
            if (item.id && item.id.endsWith("Plugin") && Check.isClass(item.target)) {
                // registering to IOC
                IOCContainer.reg(item.id, item.target, { scope: "Singleton", type: "COMPONENT", args: [] });
                pluginList.push(item.id);
            }
        });

        const pluginConfList = pluginsConf.list;
        for (const key of pluginConfList) {
            const handle: IPlugin = IOCContainer.get(key, "COMPONENT");
            if (!lodash.isFunction(handle.run)) {
                Logger.Error(`plugin ${key} must be implements method 'run'.`);
                continue;
            }
            if (pluginsConf.config[key] === false) {
                Logger.Warn(`Plugin ${key} already loaded but not effective.`);
                continue;
            }

            // sync exec
            await handle.run(pluginsConf.config[key] ?? {}, app);
        }
    }
}
