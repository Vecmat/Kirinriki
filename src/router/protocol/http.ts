/**
 * @ Author: Hanrea
 * @ version: 2022-03-21 13:14:21
 * @ copyright: Vecmat (c) - <hi(at)vecmat.com>
 */
import KoaRouter from "@koa/router";
import { Check } from "@vecmat/vendor";
import { RouterOptions } from "../option";
import { Logger } from "../../base/Logger";
import { RequestMethod } from "../mapping";
import { IOCContainer } from "../../container";
import { Handler, injectParam, injectRouter } from "../inject";
import { Kirinriki, IContext, INext, IRouter } from "../../core";

// HttpImplementation
export type HttpImplementation = (ctx: IContext, next: INext) => Promise<any>;

/**
 * HttpRouter class
 */
export class HttpRouter implements IRouter {
    app: Kirinriki;
    readonly protocol: string;
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
     * ListRouter
     *
     * @returns {*}  {KoaRouter.Middleware<any, unknown>}
     */
    ListRouter() {
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
                const ctlRouters = injectRouter(this.app, ctlClass);
                // inject param
                const ctlParams = injectParam(this.app, ctlClass);
                // tslint:disable-next-line: forin
                for (const it in ctlRouters) {
                    const router = ctlRouters[it];
                    const method = router.method;
                    const path = router.path;
                    const requestMethod = <RequestMethod>router.requestMethod;
                    const params = ctlParams[method];
                    Logger.Debug(`[HTTP/${requestMethod}]: "${path}" => ${n}.${method}`);
                    this.SetRouter(
                        path,
                        (ctx: IContext): Promise<any> => {
                            const ctl = IOCContainer.getInsByClass(ctlClass, [ctx]);
                            return Handler(this.app, ctx, ctl, method, params);
                        },
                        requestMethod
                    );
                }
            }

            // exp: in middleware
            // app.Router.SetRouter('/xxx',  (ctx: Koa.IContext): any => {...}, 'GET')
            this.app.use(this.ListRouter()).use(this.router.allowedMethods());
        } catch (err) {
            Logger.Error(err);
        }
    }
}
