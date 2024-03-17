/**
 * @ Author: Hanrea
 * @ version: 2022-03-21 13:14:21
 * @ copyright: Vecmat (c) - <hi(at)vecmat.com>
 */
import "reflect-metadata";
import { readFileSync } from "fs";
import lodash from "lodash";
import EventEmitter from "events";
import { Logger } from "../base/Logger.js";
import path, {dirname} from 'path'
import {fileURLToPath} from 'url'


import { asyncEmit } from "../vendor/eve.js";
import { Captor } from "../base/Capturer.js";
import { BootLoader } from "./BootLoader.js";
import { SavantManager } from "../base/Savant.js";
import { Exception, ARROBJ } from "@vecmat/vendor";
import { Kirinriki } from "../core/Application.js";
import { MonitorManager } from "../base/Monitor.js";
import { TAGGED_CLS } from "../container/IContainer.js";
import { BindProcessEvent } from "../serve/terminus.js";
import { IOCContainer } from "../container/Container.js";
import { ListeningOptions, Serve } from "../serve/serve.js";
import { NewRouter, RouterOptions } from "../router/index.js";
import { isUnintTest} from "../vendor/Check.js";
import { LOGO, WELCOME, COMPONENT_SCAN, CONFIGURATION_SCAN, APP_READY_HOOK } from "../base/Constants.js";

/**
 * execute bootstrap
 *
 * @param {*} target
 * @param {Function} bootFunc
 * @param {boolean} [isInitiative=false] Whether to actively execute app instantiation,
 * mainly for unittest scenarios, you need to actively obtain app instances
 * @returns {Promise<void>}
 */
const executeBootstrap = async function <TFunction extends Function>(
    target: TFunction,
    bootFunc?: Function,
    isInitiative = false
): Promise<Kirinriki> {
    // checked runtime
    // checkNodeVer();
    // unittest running environment
    const inUnintTest = isUnintTest();
    if (!isInitiative && inUnintTest) {
        throw new Exception("SYS_inUnintTest");
    }

    const app: Kirinriki = Reflect.construct(target, []);
    // type check
    if (!(app instanceof Kirinriki)) {
        console.error(`class ${target.name} does not inherit from Kirinriki`);
        process.exit(-1);
    }

    // unittest does not print startup logs
    if (inUnintTest) {
        app.silent = true;
        Logger.enable(false);
    }

    try {
        !app.silent && Logger.Log("🌈🌈🌈🌈🌈", LOGO, WELCOME);


        // // 文件的路径
        // const __filename = fileURLToPath(import.meta.url)
        // // 先获取文件所在的目录
        // const __dirname = dirname(__filename)

        let file =  path.resolve(__dirname, "../../package.json");
        let pkg = await readFileSync(file, "utf8");
        let pkgjson = JSON.parse(pkg);
        // version
        ARROBJ.defineProp(app, "version", pkgjson.version);

        // Initialize env
        BootLoader.initialize(app);

        // 输出版本信息
        Logger.Log("🎨", "", "====================================");
        Logger.Log("🎨", "", `Nodejs Version: ${process.version}`);
        Logger.Log("🎨", "", `Kirinriki Version: v${app.version}`);
        Logger.Log("🎨", "", `App Environment: ${app.env}`);
        Logger.Log("🎨", "", "====================================");

        // Exec bootFunc first
        if (lodash.isFunction(bootFunc)) {
            Logger.Log("Vecmat", "", "Execute bootFunc ...");
            await bootFunc(app);
        }

        // Set IOCContainer.app
        IOCContainer.setApp(app);

        // Create Catcher
      debugger;
        // Load global error catcher first
        // todo: remove CaptorManager
        await  BootLoader.loadCaptor(app);

        // Check all Components
        Logger.Log("Vecmat", "", "Scan Component ...");
        await BootLoader.CheckAllComponents(app, target);

        // async event APP boot start
        await asyncEmit(app, "APP_BOOT_START");

        // Load configuration
        // configuration metadata
        debugger
        await  BootLoader.LoadConfigs(app, target);
        await asyncEmit(app, "APP_CONFIG_LOADED");
        Logger.Log("Vecmat", "", "Loaded Config ...");

        // Load Addon
        await BootLoader.LoadAddons(app);
        await asyncEmit(app, "APP_ADDON_LOADED");
        Logger.Log("Vecmat", "", "Loaded Addon ...");

        // init MonitorManager
        await MonitorManager.init(app);
        // init SavantManager
        await SavantManager.init(app);

        //  Mount the monitor
        await MonitorManager.mount(app);

        // Mount the savant
        await SavantManager.mount(app);

        // Load Components
        BootLoader.LoadComponents(app);
        await asyncEmit(app, "APP_COMPONENT_LOADED");
        Logger.Log("Vecmat", "", "Loaded Components ...");

        // Load Controllers
        const controllers = BootLoader.LoadControllers(app);

        Logger.Log("Vecmat", "", "Loaded Controllers ...");

        // todo: Move this to `BootLoader`
        app.server = newServe(app);
        app.router = newRouter(app);

        // Load Routers
        Logger.Log("Vecmat", "", "Loaded Routers ...");
        app.router.LoadRouter(controllers);

        await asyncEmit(app, "APP_ROUTER_LOADED");

        // ! check: event repeat
        // Load App ready hooks
        BootLoader.LoadAppReadyHooks(app, target);
        Logger.Log("Vecmat", "", "Emit App Ready ...");

        // APP boot finish event
        await asyncEmit(app, "APP_BOOT_FINISH");

        if (!inUnintTest) {
            app.listen(app.server, listenCallback(app));
        }

        return app;
    } catch (err) {
        let skip = false;
        let sign = "BOOTERR_COMMON";
        // todo : Need stack info
        if (err instanceof Error) {
            if (err instanceof Exception) {
                sign = err.sign;
            } else {
                sign = err.name == "Error" ? err.constructor.name : "BOOT_COMMON_ERROR";
            }
        } else {
            err = new Exception("BOOT_UNKNOW_ERROR", "" + err);
        }
        // Call catcher
        const handls = Captor.match(sign);
        for (const hand of handls) {
            skip = await hand(err as Exception, app);
            if (skip) {
                break;
            }
        }
        Logger.Error(err);
        process.exit();
    }
};

/**
 * create router
 *
 * @export
 * @param {Kirinriki} app
 * @returns {*}
 */
const newRouter = function (app: Kirinriki) {
    const protocol = app.config("protocol") || "http";
    const options: RouterOptions = app.config(undefined, "router") ?? {};
    const router = NewRouter(app, options, protocol);
    return router;
};

/**
 * create serve
 *
 * @param {Kirinriki} app
 * @returns {*}
 */
const newServe = function (app: Kirinriki) {
    const protocol = app.config("protocol") || "http";
    const port = process.env.PORT || process.env.APP_PORT || app.config("app_port") || 3000;
    const hostname = process.env.IP || app.config("app_host") || "127.0.0.1";

    const options: ListeningOptions = {
        hostname,
        port,
        protocol,
        ext: {
            key: "",
            cert: "",
            protoFile: ""
        }
    };
    const pm = new Set(["https", "http2", "wss"]);
    if (pm.has(options.protocol)) {
        const keyFile = app.config("key_file") ?? "";
        const crtFile = app.config("crt_file") ?? "";
        options.ext.key = readFileSync(keyFile).toString();
        options.ext.cert = readFileSync(crtFile).toString();
    }
    if (options.protocol === "https" || options.protocol === "http2") {
        options.port = options.port == 80 ? 443 : options.port;
    }
    if (options.protocol === "grpc") {
        const proto = app.config("protoFile", "router");
        options.ext.protoFile = proto;
    }

    const server = Serve(app, options);
    return server;
};

/**
 * Listening callback function
 *
 * @param {Kirinriki} app
 * @returns {*}
 */
const listenCallback = (app: Kirinriki) => {
    return async function () {
        const options = app.server.options;

        // binding event "appStop"
        Logger.Log("Vecmat", "", "Bind App Stop event ...");
        BindProcessEvent(app, "appStop");

        // Emit app started event
        Logger.Log("Vecmat", "", "Emit App Start Listen ...");
        await asyncEmit(app, "APP_START_LISTEN");

        Logger.Log("Vecmat", "", `Server Protocol: ${options.protocol.toUpperCase()}`);
        Logger.Log(
            "Vecmat",
            "",
            `Server running at ${options.protocol === "http2" ? "https" : options.protocol}://${options.hostname || "127.0.0.1"}:${
                options.port
            }/`
        );

        // tslint:disable-next-line: no-unused-expression
        app.appDebug && Logger.Warn(`🚧 RUNNING IN DEBUG MODE! 🚧 `);
        // update Logger
        BootLoader.SetLogger(app);
    };
};

/**
 * Bootstrap application
 *
 * @export
 * @param {Function} [bootFunc]
 * @returns {ClassDecorator}
 */
export function Bootstrap(bootFunc?: Function): ClassDecorator {
    return function <TFunction extends Function>(target: TFunction) {
        if (!(target.prototype instanceof Kirinriki)) {
            throw new Exception("BOOTERR_BOOTSTRAP", `class does not inherit from Kirinriki`);
        }
        executeBootstrap(target, bootFunc);
    };
}

/**
 * Actively perform dependency injection
 * Parse the decorator, return the instantiated app.
 * @export  ExecBootStrap
 * @param {Function} [bootFunc] callback function
 * @returns
 */
export function ExecBootStrap(bootFunc?: Function) {
    return async <TFunction extends Function>(target: TFunction) => {
        if (!(target.prototype instanceof Kirinriki)) {
            throw new Exception("BOOTERR_EXECBOOTSTRAP", `class ${target.name} does not inherit from TKirinriki`);
        }
        return await executeBootstrap(target, bootFunc, true);
    };
}

/**
 * Define project scan path
 *
 * @export
 * @param {(string | string[])} [scanPath]
 * @returns {ClassDecorator}
 */
export function ComponentScan(scanPath?: string | string[]): ClassDecorator {
    return (target: any) => {
        if (!(target.prototype instanceof Kirinriki)) {
            throw new Exception("BOOTERR_COMPONENT_SCAN", `class does not inherit from Kirinriki`);
        }
        scanPath = scanPath ?? "";
        IOCContainer.saveClassMetadata(TAGGED_CLS, COMPONENT_SCAN, scanPath, target);
    };
}

/**
 * Define project configuration scan path
 *
 * @export
 * @param {(string | string[])} [scanPath]
 * @returns {ClassDecorator}
 */
export function ConfigurationScan(scanPath?: string | string[]): ClassDecorator {
    return (target: any) => {
        if (!(target.prototype instanceof Kirinriki)) {
            throw new Exception("BOOTERR_CONFIG_SCAN", `class does not inherit from Kirinriki`);
        }
        scanPath = scanPath ?? "";
        IOCContainer.saveClassMetadata(TAGGED_CLS, CONFIGURATION_SCAN, scanPath, target);
    };
}

// type AppReadyHookFunc
export type AppReadyHookFunc = (app: Kirinriki) => Promise<any>;

/**
 * bind AppReadyHookFunc
 * example:
 * export function TestDecorator(): ClassDecorator {
 *  return (target: any) => {
 *   BindAppReadyHook((app: Kirinriki) => {
 *      return Promise.resolve();
 *   }, target)
 *  }
 * }
 *
 * @export
 * @param {AppReadyHookFunc} func
 * @param {*} target
 */
export function BindAppReadyHook(func: AppReadyHookFunc, target: any) {
    IOCContainer.attachClassMetadata(TAGGED_CLS, APP_READY_HOOK, func, target);
}
