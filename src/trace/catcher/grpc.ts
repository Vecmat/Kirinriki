/**
 * @ Author: Hanrea
 * @ version: 2022-03-21 13:14:21
 * @ copyright: Vecmat (c) - <hi(at)vecmat.com>
 */

import { Exception } from "@vecmat/vendor"; 
import { StatusBuilder } from "@grpc/grpc-js";
import { Logger } from "../../base/Logger.js";
import { IContext } from "../../core/IContext.js";
import { HttpStatusCodeMap, StatusCodeConvert, GrpcStatusCodeMap } from "../code.js";


/**
 * gRPC error handler
 *
 * @export
 * @param {IContext} ctx
 * @param {Exception} err
 * @returns {*}  {Promise<any>}
 */
export function gRPCCatcher<E extends Error>(ctx: IContext, err: E) {
    try {
        let errObj;
        let code = 2;
        // http status convert to grpc status
        if (HttpStatusCodeMap.has(ctx.status)) code = StatusCodeConvert(ctx.status);
        const body = ctx.body || GrpcStatusCodeMap.get(code) || null;

        if (typeof body == "string") {
          errObj = new StatusBuilder().withCode(code).withDetails(body).build();
        } else {
          errObj = new StatusBuilder().withCode(code).build();
        }
        if(ctx.rpc?.callback){
          ctx.rpc.callback(errObj, null);
        }
        return;
    } catch (error) {
        Logger.Error(error);
        const err = new StatusBuilder().withCode(2).build();
        if (ctx.rpc?.callback) {
            ctx.rpc.callback(err, null);
        }
        return;
    }
}
