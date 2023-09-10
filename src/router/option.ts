import { RouterOptions } from "./define";
import { Kirinriki, IRouter } from "../core";
import { HttpRouter } from "./protocol/http";
import { GrpcRouter } from "./protocol/grpc";
import { WebsocketRouter } from "./protocol/ws";
import { ARROBJ, Exception } from "@vecmat/vendor";



/**
 * Get instance of Router
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

