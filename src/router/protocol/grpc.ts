/**
 * @ Author: Hanrea
 * @ version: 2022-03-21 13:14:21
 * @ copyright: Vecmat (c) - <hi(at)vecmat.com>
 */
import { Helper } from "@vecmat/vendor";
import { RouterOptions } from "../option";
import { Logger } from "../../base/Logger";
import { IOCContainer } from "../../container";
import { ListServices, LoadProto } from "../../proto";
import { Handler, injectParam, injectRouter } from "../inject";
import { ServiceDefinition, UntypedHandleCall, UntypedServiceImplementation } from "@grpc/grpc-js";
import { Kirinriki, IRouter, IRpcServerUnaryCall, IRpcServerCallback } from "../../core";

/**
 * GrpcRouter Options
 *
 * @export
 * @interface GrpcRouterOptions
 */
export interface GrpcRouterOptions extends RouterOptions {
    protoFile: string;
}

/**
 * ServiceImplementation
 *
 * @export
 * @interface ServiceImplementation
 */
export interface ServiceImplementation {
    service: ServiceDefinition;
    implementation: Implementation;
}
/**
 * Implementation
 *
 * @export
 * @interface Implementation
 */
export interface Implementation {
    [methodName: string]: UntypedHandleCall;
}

/**
 * CtlInterface
 *
 * @interface CtlInterface
 */
interface CtlInterface {
    [path: string]: CtlProperty;
}
/**
 * CtlProperty
 *
 * @interface CtlProperty
 */
interface CtlProperty {
    name: string;
    ctl: Function;
    method: string;
    params: any;
}

export class GrpcRouter implements IRouter {
    app: Kirinriki;
    readonly protocol: string;
    options: GrpcRouterOptions;
    router: Map<string, ServiceImplementation>;

    constructor(app: Kirinriki, options?: RouterOptions) {
        this.app = app;
        options.ext = options.ext || {};
        this.options = {
            ...options,
            protoFile: options.ext.protoFile
        };
        this.router = new Map();
    }

    /**
     * SetRouter
     *
     * @param {string} name
     * @param {ServiceDefinition<UntypedServiceImplementation>} service
     * @param {UntypedServiceImplementation} implementation
     * @returns {*}
     * @memberof GrpcRouter
     */
    SetRouter(name: string, service: any, implementation: UntypedServiceImplementation) {
        if (Helper.isEmpty(name)) {
            return;
        }
        const value = {
            service: service,
            implementation: implementation
        };
        this.router.set(name, value);
        this.app?.server?.RegisterService(value);
    }

    /**
     * ListRouter
     *
     * @returns {*}  {Map<string, ServiceImplementation>}
     * @memberof GrpcRouter
     */
    ListRouter(): Map<string, ServiceImplementation> {
        return this.router;
    }

    /**
     * Loading router
     *
     * @memberof Router
     */
    async LoadRouter(list: any[]) {
        try {
            // load proto files
            const pdef = LoadProto(this.options.protoFile);
            const services = ListServices(pdef);

            const ctls: CtlInterface = {};
            for (const n of list) {
                const ctlClass = IOCContainer.getClass(n, "CONTROLLER");
                // inject router
                const ctlRouters = injectRouter(this.app, ctlClass);
                // inject param
                const ctlParams = injectParam(this.app, ctlClass);

                for (const it in ctlRouters) {
                    const router = ctlRouters[it];
                    const method = router.method;
                    const path = router.path;
                    const params = ctlParams[method];

                    ctls[path] = {
                        name: n,
                        ctl: ctlClass,
                        method,
                        params
                    };
                }
            }

            // 循环匹配服务绑定路由
            for (const si of services) {
                const serviceName = si.name;
                // Verifying
                if (!si.service || si.handlers.length === 0) {
                    Logger.Warn("Ignore", serviceName, "which is an empty service");
                    return;
                }
                const impl: { [key: string]: UntypedHandleCall } = {};
                for (const handler of si.handlers) {
                    const path = handler.path;
                    if (ctls[path]) {
                        const ctlItem = ctls[path];
                        Logger.Debug(`[GPRC]: "${path}" => ${ctlItem.name}.${ctlItem.method}`);
                        impl[handler.name] = (call: IRpcServerUnaryCall<any, any>, callback: IRpcServerCallback<any>) => {
                            return this.app.callback("grpc", ctx => {
                                const ctl = IOCContainer.getInsByClass(ctlItem.ctl, [ctx]);
                                return Handler(this.app, ctx, ctl, ctlItem.method, ctlItem.params);
                            })(call, callback);
                        };
                    }
                }
                this.SetRouter(serviceName, si.service, impl);
            }
        } catch (err) {
            Logger.Error(err);
        }
    }
}
