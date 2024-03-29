/**
 * @ Author: Hanrea
 * @ version: 2022-03-21 13:14:21
 * @ copyright: Vecmat (c) - <hi(at)vecmat.com>
 */
import { Check } from "@vecmat/vendor";
import { RouterOptions } from "../index.js";
import { Logger } from "../../base/Logger.js";
import { IRouter } from "../../core/IApplication.js";
import { Kirinriki } from "../../core/Application.js";
import { IOCContainer } from "../../container/index.js";
import { LoadProto, ListServices } from "../../proto/proto.js";
import { buildRouter, buildParams, buildHandler } from "../builder.js";
import { IRpcServerUnaryCall, IRpcServerCallback, IContext, INext } from "../../core/IContext.js";
import { ServiceDefinition, UntypedHandleCall, UntypedServiceImplementation } from "@grpc/grpc-js";


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
    app!: Kirinriki;
    readonly protocol!: string;
    options: GrpcRouterOptions;
    router: Map<string, ServiceImplementation>;
    constructor(app: Kirinriki, options: RouterOptions) {
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
        if (Check.isEmpty(name)) {
            return;
        }
        const value = {
            service: service,
            implementation: implementation
        };
        this.router.set(name, value);
        if (this.app.server.RegisterService) {
          this.app.server.RegisterService(value);
        }

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
                const ctlRouters = buildRouter(this.app, ctlClass);
                // inject param
                const ctlParams = buildParams(this.app, ctlClass);

                for (const it in ctlRouters) {
                    const router = ctlRouters[it];
                    if (!router) {
                        break;
                    }
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
                        if (!ctlItem) {
                            break;
                        }
                        Logger.Debug(`[GPRC]: "${path}" => ${ctlItem.name}.${ctlItem.method}`);
                        // Middleware<DefaultState, DefaultContext, any>
                        impl[handler.name] = (call: IRpcServerUnaryCall<any, any>, callback: IRpcServerCallback<any>) => {
                            return this.app.callback("grpc", (ctx: IContext ) => {
                                return buildHandler(this.app, ctx, ctlItem.ctl, ctlItem.method, ctlItem.params);
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
