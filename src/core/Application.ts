/**
 * @ Author: Hanrea
 * @ version: 2022-03-21 13:14:21
 * @ copyright: Vecmat (c) - <hi(at)vecmat.com>
 */


import Koa from "koa";
import lodash from "lodash";
import { Captor } from "../base";
import { ServerResponse } from "http";
import koaCompose from "koa-compose";
import onFinished from "on-finished";
import { IContext } from "./IContext";
import { ARROBJ } from "@vecmat/vendor";
import { Logger } from "../base/Logger";
import { CreateContext } from "./Context";
import { MetadataClass } from "./Metadata";
import { Application } from "../container";
import { InitOptions, IRouter, IApplication } from "./IApplication";


/**
 * Application 
 * @export
 * @class Kirinriki
 * @extends {Koa}
 * @implements {BaseApp}
 */
export class Kirinriki extends Koa implements Application {
    //   public env: string;
    public version: string;
    public options: InitOptions;

    //
    public appPath: string;
    public rootPath: string;
    public krnrkPath: string;
    public appDebug: boolean;

    //
    public captor: Captor;
    public router: IRouter;
    public server: IApplication;
    private metadata: MetadataClass;

    //
    public vms: Record<string ,string>;

    /**
     * Creates an instance of Kirinriki.
     * @param {InitOptions} options
     * @memberof Kirinriki
     */
    protected constructor(
        options: InitOptions = {
            appDebug: true,
            appPath: "",
            rootPath: "",
            krnrkPath: ""
        }
    ) {
        super();
        this.options = options ?? {};
        this.env = process.env.KIRINRIKI_ENV || process.env.NODE_ENV;
        const { appDebug, appPath, rootPath, krnrkPath } = this.options;
        this.appDebug = appDebug;
        this.appPath = appPath;
        this.rootPath = rootPath;
        this.krnrkPath = krnrkPath;
        this.metadata = new MetadataClass();
        // constructor
        this.init();
        // catch error
        this.globalErrorCatch();
    }

    /**
     * app custom init, must be defined options
     */
    public init(): void {}

    /**
     * Set application metadata
     *
     * @param {string} key
     * @param {*} value
     * @memberof Kirinriki
     */
    setMetaData(key: string, value: any): any {
        // private
        if (key.startsWith("_")) {
            ARROBJ.defineProp(this, key, value);
            return;
        }
        this.metadata.set(key, value);
    }

    /**
     * Get application metadata by key
     *
     * @param {string} key
     * @memberof Kirinriki
     */
    getMetaData(key: string): any {
        // private
        if (key.startsWith("_")) {
            return Reflect.get(this, key);
        }
        return this.metadata.get(key);
    }

    /**
     * Use the given koa savant `fn`.
     * support generator func
     * @param {Function} fn
     * @returns {any}
     * @memberof Kirinriki
     */
    public use(fn: Function): any {
        if (!lodash.isFunction) {
            Logger.Error("The paramter is not a function.");
            return;
        }
        return super.use(<any>fn);
    }

    /**
     * Use the given Express savant `fn`.
     *
     * @param {function} fn
     * @returns {any}
     * @memberof Kirinriki
     */
    public useExp(fn: Function): any {
        if (!lodash.isFunction) {
            Logger.Error("The paramter is not a function.");
            return;
        }
        fn = parseExp(fn);
        return this.use(fn);
    }

    /**
     * Read app configuration
     *
     * @param {any} name
     * @param {string} [type="config"]
     * @memberof Kirinriki
     */
    public config(name: string, type = "config") {
        try {
            const caches = this.getMetaData("_configs") ?? {};
            // tslint:disable-next-line: no-unused-expression
            caches[type] ?? (caches[type] = {});
            if (name === undefined) {
                return caches[type];
            }
            if (lodash.isString(name)) {
                // name不含. 一级
                if (name.indexOf(".") === -1) {
                    return caches[type][name];
                } // name包含. 二级
                const keys = name.split(".");
                const value = caches[type][keys[0]] ?? {};
                return value[keys[1]];
            }
            return caches[type][name];
        } catch (err) {
            Logger.Error(err);
            return null;
        }
    }

    /**
     * Create Context
     *
     * @param {*} req
     * @param {*} res
     * @param {string} [protocol]
     * @returns {IContext}  {*}
     * @memberof Kirinriki
     */
    public createContext(req: any, res: any, protocol?: string): IContext {
        let resp;
        // protocol
        protocol = protocol ?? "http";

        if (["ws", "wss", "grpc"].includes(protocol)) {
            resp = new ServerResponse(req);
        } else {
            resp = res;
        }
        // create context
        const context = super.createContext(req, resp);

        ARROBJ.defineProp(context, "protocol", protocol);
        return CreateContext(context, req, res);
    }

    /**
     * listening and start server
     *
     * @param {Function} server IApplication
     * @param {Function} [listenCallback] () => void
     * @returns {*}  any
     * @memberof Kirinriki
     */
    public listen(server?: any, listenCallback?: any): any {
        this.server = server ?? this.server;
        listenCallback = listenCallback
            ? listenCallback
            : () => {
                  Logger.Log("think", "", `Server running ...`);
              };
        return this.server.Start(listenCallback);
    }

    /**
     * return a request handler callback
     * for http/gRPC/ws server.
     *
     * @param {KirinrikiProtocol} [protocol]
     * @param {(ctx: IContext) => Promise<any>} [reqHandler]
     * @returns {*}
     * @memberof Kirinriki
     */
    callback(protocol = "http", reqHandler?: (ctx: IContext) => Promise<any>) {
        if (reqHandler) {
            this.middleware.push(reqHandler);
        }
        const fn = koaCompose(this.middleware);
        return (req: unknown, res: unknown) => {
            const context = this.createContext(req, res, protocol);
            return this.handleRequest(context, fn);
        };
    }

    /**
     * Handle request in callback.
     *
     * @private
     * @param {IContext} ctx
     * @param {(ctx: IContext) => Promise<any>} fnSavant
     * @returns {*}
     * @memberof Kirinriki
     */
    private async handleRequest(ctx: IContext, fnSavant: (ctx: IContext) => Promise<any>) {
        const res = ctx.res;
        res.statusCode = 404;
        const onerror = (err: Error) => ctx.onerror(err);
        onFinished(res, onerror);
        return fnSavant(ctx);
    }

    /**
     * registration exception handling
     *
     * @memberof Kirinriki
     */
    private globalErrorCatch(): void {
        // koa error
        this.removeAllListeners("error");
        this.on("error", (err: Error) => {
            console.trace(err);
            return;
        });
        // process warning
        process.removeAllListeners("warning");
        process.on("warning", warning => {
            Logger.Warn(warning);
            return;
        });

        // promise reject error
        process.removeAllListeners("unhandledRejection");
        process.on("unhandledRejection", (err: Error) => {
            console.trace(err);
            return;
        });
        // uncaught exception
        process.removeAllListeners("uncaughtException");
        process.on("uncaughtException", err => {
            if (err.message.indexOf("EADDRINUSE") > -1) {
                Logger.Error(lodash.toString(err));
                process.exit(-1);
            }
            return;
        });
    }
}

/**
 * Convert express savant for koa
 *
 * @param {function} fn
 * @returns
 * @memberof Kirinriki
 */
function parseExp(fn: Function) {
    return function (ctx: IContext, next: Function) {
        if (fn.length < 3) {
            fn(ctx.req, ctx.res);
            return next();
        }
        return new Promise((resolve, reject) => {
            fn(ctx.req, ctx.res, (err: Error) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(next());
                }
            });
        });
    };
}
