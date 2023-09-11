/**
 * @ Author: Hanrea
 * @ version: 2022-03-21 13:14:21
 * @ copyright: Vecmat (c) - <hi(at)vecmat.com>
 */

import { Captor } from "../base";
import { IContext } from "../core";
import { WSCatcher } from "./catcher/ws";
import { Exception } from "@vecmat/vendor";
import { HTTPCatcher } from "./catcher/http";
import { gRPCCatcher } from "./catcher/grpc";

/**
 * Global Error handler
 *
 * @template T
 * @param {IContext} ctx
 * @param {(Exception)} err
 */
export async function catcher(err: Error , ctx: IContext) {
    let skip = false;
    let excep: Exception;
    let sign = "COMMON_ERROR";

    
    if (err instanceof Error) {
        if (err instanceof Exception) {
            excep = err;
            sign = err.sign;
        } else {
            sign = err.name == "Error" ? err.constructor.name : err.name;
            excep = new Exception(sign, err.message);
        }
    } else {
        sign = "UNKNOW_ERROR";
        excep = new Exception("UNKNOW_ERROR", "" + err);
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
