/**
 * @ Author: Hanrea
 * @ version: 2022-03-21 13:14:21
 * @ copyright: Vecmat (c) - <hi(at)vecmat.com>
 */


import { Check } from "@vecmat/vendor";
import { Logger } from "../../base/Logger.js";
import { IRouter } from "../../core/IApplication.js";
import { Kirinriki } from "../../core/Application.js";
import KoaRouter, { RouterOptions } from "@koa/router";
import { IOCContainer } from "../../container/index.js";
import { IContext, INext } from "../../core/IContext.js";
import { RequestMethod, ASPECT_SAVANT } from "../define.js";
import { DefaultContext, DefaultState, Middleware } from "koa";
import { buildRouter, buildParams, buildHandler } from "../builder.js";

// HttpImplementation
export type HttpImplementation = (ctx: IContext, next: INext) => Promise<any>;

/**
 * HttpRouter class
 */
export class HttpRouter implements IRouter {
    app: Kirinriki;
    readonly protocol!: string;
    options: RouterOptions;
    router: KoaRouter;

    constructor(app: Kirinriki, options?: RouterOptions) {
        this.app = app;
        this.options = {
            ...options
        };
        // initialize
        this.router = new KoaRouter(this.options);
    }

    /**
     * Set router
     *
     * @param {string} path
     * @param {RequestMethod} [method]
     */
    SetRouter(path: string, func: HttpImplementation, method?: RequestMethod) {
        if (Check.isEmpty(method)) {
            return;
        }
        method = method ?? RequestMethod.ALL;
        this.router[method](path, func);
    }

    /**
     * todo :sync ws/gprc
     * @param path
     * @param func
     */
    useSavant(path: string, ...func: Middleware[]) {
        this.router.use(path, ...func);
    }

    /**
     * ListRouter
     *
     * @returns {*}  {KoaRouter.Middleware<any, unknown>}
     */
    ListRouter(): KoaRouter.Middleware<DefaultState, DefaultContext> {
        return this.router.routes();
    }

    /**
     *
     *
     * @param {any[]} list
     */
    LoadRouter(list: any[]) {
        try {
            for (const n of list) {
                const ctlClass = IOCContainer.getClass(n, "CONTROLLER");
                // inject router
                const ctlRouters = buildRouter(this.app, ctlClass);
                // inject param
                const ctlParams = buildParams(this.app, ctlClass);
                // tslint:disable-next-line: forin
                for (const it in ctlRouters) {
                    const router = ctlRouters[it];
                    if(!router){
                      break;
                    }
                    const method = router.method;
                    const path = router.path;
                    const requestMethod = <RequestMethod>router.requestMethod;
                    const params = ctlParams[method];
                    // todo: record into mapdata for show table
                    Logger.Debug(`[HTTP/${requestMethod}]: "${path}" => ${n}.${method}`);

                    // todo: Other protocols currently do not support router savant
                    const routersavant: Middleware[] = IOCContainer.getPropertyData(ASPECT_SAVANT, ctlClass, method);

                    if (routersavant && routersavant.length) {
                        this.useSavant(path, ...routersavant);
                    }
                    this.SetRouter(
                        path,
                        async (ctx: IContext): Promise<any> => {
                            await buildHandler(this.app, ctx, ctlClass, method, params);

                        },
                        requestMethod
                    );
                }
            }

            // exp: in savant
            // app.Router.SetRouter('/xxx',  (ctx: Koa.IContext): any => {...}, 'GET')
            this.app.use(this.ListRouter()).use(this.router.allowedMethods());
        } catch (err) {
            Logger.Error(err);
        }
    }
}
