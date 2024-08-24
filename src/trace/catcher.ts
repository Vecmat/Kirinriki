/**
 * @ Author: Hanrea
 * @ version: 2022-03-21 13:14:21
 * @ copyright: Vecmat (c) - <hi(at)vecmat.com>
 */

import { Exception } from "@vecmat/vendor";
import { WSCatcher } from "./catcher/ws.js";
import { Captor } from "../base/Capturer.js";
import { IContext } from "../core/IContext.js";
import { gRPCCatcher } from "./catcher/grpc.js";
import { HTTPCatcher } from "./catcher/http.js";


/**
 * Global Error handler
 *
 * @template T
 * @param {IContext} ctx
 * @param {(Exception)} err
 */
export async function catcher<E extends Error>(err: E , ctx: IContext) {
    let skip = false;
    let excep = err;
    let sign = "COMMON_ERROR";

    if (err instanceof Error) {
        if (err instanceof Exception) {
            sign = err.sign;
        } else {
            sign = err.name == "Error" ? err.constructor.name : err.name;
            // excep = new Exception(sign, err.message);
        }
    } else {
        sign = "UNKNOW_ERROR";

    }

    // Global error handling
    const handls = Captor.match(sign);
    for (const hand of handls) {
        skip = await hand(excep, ctx);
        if (skip) {
            break;
        }
    }

    // todo: Move to runner's `finnal` function
    switch (ctx.protocol) {
        case "grpc":
            return gRPCCatcher(ctx, excep);
        case "ws":
        case "wss":
            return WSCatcher(ctx, excep);
        default:
            return HTTPCatcher(ctx, excep);
    }
}
