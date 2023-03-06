/**
 * @ Author: Hanrea
 * @ version: 2022-03-21 13:14:21
 * @ copyright: Vecmat (c) - <hi(at)vecmat.com>
 */
import "reflect-metadata";
import fs from "fs";
import EventEmitter from "events";
import { Kirinriki } from '../core';
import { Logger } from "./Logger";
import { Captor } from "./Capturer";
import { BootLoader } from "./BootLoader";
import { Exception, Helper } from "@vecmat/vendor";
import { NewRouter, RouterOptions } from "../router";
import { IOCContainer, TAGGED_CLS } from "../container";
import { checkRuntime, checkUTRuntime, KIRINRIKI_VERSION } from "./Check";
import { APP_READY_HOOK, COMPONENT_SCAN, CONFIGURATION_SCAN, LOGO, WELCOME } from "./Constants";
import { BindProcessEvent, Serve, ListeningOptions } from "../serve";

/**
 * execute bootstrap
 *
 * @param {*} target
 * @param {Function} bootFunc
 * @param {boolean} [isInitiative=false] Whether to actively execute app instantiation, 
 * mainly for unittest scenarios, you need to actively obtain app instances
 * @returns {Promise<void>}
 */
const executeBootstrap = async function (target: any, bootFunc: Function, isInitiative = false): Promise<Kirinriki> {
    // checked runtime
    checkRuntime();
    // unittest running environment
    const isUTRuntime = checkUTRuntime();
    if (!isInitiative && isUTRuntime) {
        return;
    }

    const app: Kirinriki = Reflect.construct(target, []);
    // 类型检查
    if (!(app instanceof Kirinriki)) {
        console.error(`class ${target.name} does not inherit from Kirinriki`);
        process.exit(-1);
    }
    // unittest does not print startup logs
    if (isUTRuntime) {
        app.silent = true;
        Logger.enable(false);
    }


    try {
        !app.silent && Logger.Log("🌈🌈🌈🌈🌈", LOGO, WELCOME);
       
        // version
        Helper.define(app, "version", KIRINRIKI_VERSION);

        // todo 

        // Initialize env
        BootLoader.initialize(app);

        // 输出版本信息
        Logger.Log('🎨', "", '====================================');
        Logger.Log('🎨', "", `Nodejs Version: ${process.version}`);
        Logger.Log('🎨', "", `Kirinriki Version: v${app.version}`);
        Logger.Log('🎨', "", `App Environment: ${app.env}`);
        Logger.Log('🎨', "", "====================================");


        // exec bootFunc
        if (Helper.isFunction(bootFunc)) {
            Logger.Log('Vecmat', '', 'Execute bootFunc ...');
            await bootFunc(app);
        }

        // Set IOCContainer.app
        IOCContainer.setApp(app);
        // Create Catcher
        app.captor = new Captor();



        Logger.Log('Vecmat', '', 'ComponentScan ...');

        // Check all bean
        BootLoader.CheckAllComponents(app, target);


        // Load configuration
        Logger.Log('Vecmat', '', 'Load Configurations ...');
        // configuration metadata
        const configurationMetas = BootLoader.GetConfigurationMetas(app, target);
        BootLoader.LoadConfigs(app, configurationMetas);


        // todo 先加载全局错误处理？
        BootLoader.loadCaptor(app);

        // Load Plugin
        Logger.Log('Vecmat', '', 'Load Plugins ...');
        await BootLoader.LoadPlugins(app);

        await asyncEvent(app, 'appBoot');


        // Load App ready hooks
        BootLoader.LoadAppReadyHooks(app, target);

        // Load Middleware
        Logger.Log('Vecmat', '', 'Load Middlewares ...');
        await BootLoader.LoadMiddlewares(app);
        // Load Components
        Logger.Log('Vecmat', '', 'Load Components ...');
        BootLoader.LoadComponents(app);
        // Load Services
        Logger.Log('Vecmat', '', 'Load Services ...');
        BootLoader.LoadActions(app);
        // Load Controllers
        Logger.Log('Vecmat', '', 'Load Controllers ...');
        const controllers = BootLoader.LoadControllers(app);

        // Create Server
        app.server = newServe(app);
        // Create router
        app.router = newRouter(app);


        // Load Routers
        Logger.Log('Vecmat', '', 'Load Routers ...');
        app.router.LoadRouter(controllers);

        // Emit app ready event
        Logger.Log('Vecmat', '', 'Emit App Ready ...');
        await asyncEvent(app, 'appReady');

        if (!isUTRuntime) {
            app.listen(app.server, listenCallback(app));
        }

        return app;
    } catch (err) {
        let skip = false;
        let sign = "BOOTERR_COMMON";
        // 有些错误类为复制name属性
        if (err instanceof Error) {
            if (err instanceof Exception) {
                sign = err.sign;
            } else {
                sign = err.name == "Error" ? err.constructor.name : "BOOT_COMMON_ERROR";
            }
        } else {
            debugger;
            // todo 需要调试 （非错误类型）
            err = new Exception("BOOT_UNKNOW_ERROR", "" + err);
        }
        // 多个函数处理,可控制跳过后续处理
        const handls = Captor.match(sign);
        for (const hand of handls) {
            skip = await hand(err, app);
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
    const options: RouterOptions = app.config(undefined, 'router') ?? {};
    const router = NewRouter(app, options, protocol);
    return router;
};

/**
 * Listening callback function
 *
 * @param {Kirinriki} app
 * @returns {*} 
 */
const listenCallback = (app: Kirinriki) => {
    return function () {
        const options = app.server.options;

        // binding event "appStop"
        Logger.Log('Vecmat', '', 'Bind App Stop event ...');
        BindProcessEvent(app, 'appStop');

        // Emit app started event
        Logger.Log('Vecmat', '', 'Emit App Start ...');
        asyncEvent(app, 'appStart');

        Logger.Log('Vecmat', '', `Server Protocol: ${(options.protocol).toUpperCase()}`);
        Logger.Log('Vecmat', "", `Server running at ${options.protocol === "http2" ? "https" : options.protocol}://${options.hostname || '127.0.0.1'}:${options.port}/`);

        // tslint:disable-next-line: no-unused-expression
        app.appDebug && Logger.Warn(`🚧 RUNNING IN DEBUG MODE! 🚧 `);
        // update Logger 
        BootLoader.SetLogger(app);
    };
};

/**
 * create serve
 *
 * @param {Kirinriki} app
 * @returns {*}  
 */
const newServe = function (app: Kirinriki) {
    const protocol = app.config("protocol") || "http";
    const port = process.env.PORT || process.env.APP_PORT ||
        app.config('app_port') || 3000;
    const hostname = process.env.IP ||
        process.env.HOSTNAME?.replace(/-/g, '.') || app.config('app_host') || '127.0.0.1';

    const options: ListeningOptions = {
        hostname, port, protocol,
        ext: {
            key: "",
            cert: "",
            protoFile: "",
        },
    };
    const pm = new Set(["https", "http2", "wss"]);
    if (pm.has(options.protocol)) {
        const keyFile = app.config("key_file") ?? "";
        const crtFile = app.config("crt_file") ?? "";
        options.ext.key = fs.readFileSync(keyFile).toString();
        options.ext.cert = fs.readFileSync(crtFile).toString();
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
 * Execute event as async
 *
 * @param {Kirinriki} event
 * @param {string} eventName
 */

const asyncEvent = async function (event: EventEmitter, eventName: string) {
    const ls: any[] = event.listeners(eventName);
    // eslint-disable-next-line no-restricted-syntax
    for await (const func of ls) {
        if (Helper.isFunction(func)) {
            func();
        }
    }
    return event.removeAllListeners(eventName);
};

/**
 * Bootstrap application
 *
 * @export
 * @param {Function} [bootFunc]
 * @returns {ClassDecorator}
 */
export function Bootstrap(bootFunc?: Function): ClassDecorator {
    return function (target: any) {
        if (!(target.prototype instanceof Kirinriki)) {
            throw new Exception("BOOTERR_BOOTSTRAP",`class does not inherit from Kirinriki`);
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
    return async (target: any) => {
        if (!(target.prototype instanceof Kirinriki)) {
            throw new Exception("BOOTERR_EXECBOOTSTRAP",`class ${target.name} does not inherit from TKirinriki`);
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
            throw new Exception("BOOTERR_COMPONENT_SCAN",`class does not inherit from Kirinriki`);
        }
        scanPath = scanPath ?? '';
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
            throw new Exception("BOOTERR_CONFIG_SCAN",`class does not inherit from Kirinriki`);
        }
        scanPath = scanPath ?? '';
        IOCContainer.saveClassMetadata(TAGGED_CLS, CONFIGURATION_SCAN, scanPath, target);
    };
}

// type AppReadyHookFunc
export type AppReadyHookFunc = (app: Kirinriki) => Promise<any>

/**
 * bind AppReadyHookFunc
 * example:
 * export function TestDecorator(): ClassDecorator {
 *  return (target: any) => {
 *   BindAppReadyHook((app: Kirinriki) => {
 *      // todo
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
