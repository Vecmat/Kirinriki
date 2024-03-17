/**
 * @ Author: Hanrea
 * @ version: 2022-03-21 13:14:21
 * @ copyright: Vecmat (c) - <hi(at)vecmat.com>
 */


import Koa, { DefaultContext, DefaultState, Middleware } from "koa";
import lodash from "lodash";
import onFinished from "on-finished";
import koaCompose from "koa-compose";
import { ServerResponse } from "http";
import { ARROBJ } from "@vecmat/vendor";
import { IContext } from "./IContext.js";
import { Logger } from "../base/Logger.js";
import { Captor } from "../base/Capturer.js";
import { CreateContext } from "./Context.js";
import { MetadataClass } from "./Metadata.js";
import { SavantManager } from "../base/Savant.js";
import { Application } from "../container/IContainer.js";
import { InitOptions, IRouter, IApplication } from "./IApplication.js";


/**
 * Application
 * @export
 * @class Kirinriki
 * @extends {Koa}
 * @implements {BaseApp}
 */
export class Kirinriki extends Koa implements Application {
    public env: string;
    public version!: string;
    public options: InitOptions;

    public appPath: string;
    public rootPath: string;
    public krnrkPath: string;
    public appDebug: boolean;

    public captor!: Captor;
    public router!: IRouter;
    private savanter!: SavantManager;
    public server!: IApplication;
    private metadata: MetadataClass;

    public vms!: Record<string, string>;


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
        this.env = process.env.KIRINRIKI_ENV || process.env.NODE_ENV || "";
        const { appDebug, appPath, rootPath, krnrkPath } = this.options;
        this.appDebug = appDebug || true;
        this.appPath = appPath || "";
        this.rootPath = rootPath || "";
        this.krnrkPath = krnrkPath || "";
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
     * Use the given koa middleware `fn`.
     * support generator func
     * @param {Function} fn
     * @returns {any}
     * @memberof Kirinriki
     */
    public use(fn: Function): any {
        if (!lodash.isFunction(fn)) {
            Logger.Error("The paramter is not a function.");
            return;
        }
        return super.use(<any>fn);
    }

    /**
     * Read app configuration
     *
     * @param {any} name
     * @param {string} [type="config"]
     * @memberof Kirinriki
     */
    public config(name: string | symbol | undefined, type = "config") {
        try {
            const caches = this.getMetaData("_configs") ?? {};
            // tslint:disable-next-line: no-unused-expression
            caches[type] ?? (caches[type] = {});
            if (name === undefined) {
                return caches[type];
            }
            if (lodash.isString(name)) {
                if (name.indexOf(".") === -1) {
                    return caches[type][name];
                }
                const keys = name.split(".");
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                const value = caches[type][keys[0]!] ?? {};
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                return value[keys[1]!];
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
    callback(protocol = "http", reqHandler?: any) {
        if (reqHandler) {
            this.middleware.push(reqHandler);
        }
        const fn = koaCompose(this.middleware);
        return async (req: unknown, res: unknown) => {
            const context = this.createContext(req, res, protocol);
            return await this.handleRequest(context, fn);
        };
    }

    /**
     * Handle request in callback.
     *
     * @private
     * @param {IContext} ctx
     * @param {(ctx: IContext) => Promise<any>} composes
     * @returns {*}
     * @memberof Kirinriki
     */
    private async handleRequest(ctx: IContext, composes: (ctx: IContext) => Promise<any>) {
        const res = ctx.res;
        res.statusCode = 404;
        // todo 移除该方法
        onFinished(res, function (err: Error | null, msg: any) {
            if (err) {
                ctx.onerror(err);
            }
            return;
        });
        return composes(ctx);
    }

    /**
     * registration exception handling
     *
     * @memberof Kirinriki
     */
    private globalErrorCatch(): void {
        // todo: Bind Captor system
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
