import { ARROBJ } from "@vecmat/vendor";
import { GrpcRouter } from "./protocol/grpc";
import { HttpRouter } from "./protocol/http";
import { Kirinriki, IRouter } from "../core";
import { WebsocketRouter } from "./protocol/ws";

/**
 * RouterOptions
 *
 * @export
 * @interface RouterOptions
 */
export interface RouterOptions {
    prefix: string
    /**
     * Methods which should be supported by the router.
     */
    methods?: string[]
    routerPath?: string
    /**
     * Whether or not routing should be case-sensitive.
     */
    sensitive?: boolean
    /**
     * Whether or not routes should matched strictly.
     *
     * If strict matching is enabled, the trailing slash is taken into
     * account when matching routes.
     */
    strict?: boolean
    /**
     * gRPC protocol file
     */
    protoFile?: string
    // 
    /**
     * Other extended configuration
     */
    ext?: any
}

/**
 * get instance of Router
 *
 * @export
 * @param {Kirinriki} app
 * @param {RouterOptions} options
 * @param {string} [protocol]
 * @returns {*}  {IRouter}
 */
export function NewRouter(app: Kirinriki, options: RouterOptions, protocol?: string): IRouter {
    let router;
    switch (protocol) {
        case "grpc":
            router = new GrpcRouter(app, options);
            break;
        case "ws":
        case "wss":
            router = new WebsocketRouter(app, options);
            break;
        default:
            router = new HttpRouter(app, options);
    }
    ARROBJ.defineProp(router, "protocol", protocol);
    return router;
}