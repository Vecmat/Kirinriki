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
    let sign = "COMMON_ERROR";
    let excep: Exception;
    // 有些错误类为复制name属性
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
    // 多个函数处理,可控制跳过后续处理
    const handls = Captor.match(sign);
    for (const hand of handls) {
        skip = await hand(excep, ctx);
        if (skip) {
            break;
        }
    }

    // 使用默认全局错误处理
    // todo 更改下处理 ,错误应该只交给错误拦截器处理，放在final内执行即可
    // 更改为返回数据即可
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
