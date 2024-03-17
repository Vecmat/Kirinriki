
import { RouterOptions } from "./define.js";
import { ARROBJ } from "@vecmat/vendor";
import { Kirinriki } from "../core/Application.js";
import { IRouter } from "../core/IApplication.js";
import { GrpcRouter, WebsocketRouter, HttpRouter } from "./index.js";



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

