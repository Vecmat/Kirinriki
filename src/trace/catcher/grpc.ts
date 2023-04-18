/**
 * @ Author: Hanrea
 * @ version: 2022-03-21 13:14:21
 * @ copyright: Vecmat (c) - <hi(at)vecmat.com>
 */

import { IContext } from "../../core";
import { Logger } from "../../base/Logger";
import { Exception } from "@vecmat/vendor"; 
import { StatusBuilder } from "@grpc/grpc-js";
import { GrpcStatusCodeMap, HttpStatusCodeMap, StatusCodeConvert } from "../code";

/**
 * gRPC error handler
 *
 * @export
 * @param {IContext} ctx
 * @param {Capturer} err
 * @returns {*}  {Promise<any>}
 */
export function gRPCCatcher(ctx: IContext, err: Exception): Promise<any> {
    try {
        let errObj;
        let code = 2;
        // code 指的是 grpc的错误码
        // http status convert to grpc status
        if (HttpStatusCodeMap.has(ctx.status)) code = StatusCodeConvert(ctx.status);
        const body = ctx.body || GrpcStatusCodeMap.get(code) || null;

        if (typeof body == "string") errObj = new StatusBuilder().withCode(code).withDetails(body).build();
        //todo 将错误信息返回
        else errObj = new StatusBuilder().withCode(code).build();

        ctx.rpc.callback(errObj, null);
        return;
    } catch (error) {
        Logger.Error(error);
        ctx.rpc.callback(new StatusBuilder().withCode(2).build(), null);
    }
}
