/**
 * @ Author: Hanrea
 * @ version: 2022-03-21 13:14:21
 * @ copyright: Vecmat (c) - <hi(at)vecmat.com>
 */
import lodash from "lodash";
import { catcher } from "../catcher.js";
import { Exception } from "@vecmat/vendor";
import { StatusCodeConvert } from "../code.js";
import { IContext, INext } from "../../core/IContext.js";
import { DefaultLogger as Logger } from "@vecmat/printer";

/**
 * grpcRunner
 *
 * @param {IContext} ctx
 * @param {Function} next
 * @param {*} ext
 * @returns
 */
export async function grpcRunner(ctx: IContext, next: INext, ext?: any): Promise<any> {
    const timeout = ext.timeout || 10000;
    // set ctx start time
    const startTime = Date.now();
    ctx.setMetaData("startTime", `${startTime}`);

    ctx.rpc.call.metadata.set("X-Powered-By", "Kirinriki");
    ctx.rpc.call.sendMetadata(ctx.rpc.call.metadata);

    // event callback
    const finish = () => {
        const now = Date.now();
        const originalPath = ctx.getMetaData("originalPath");
        const startTime = ctx.getMetaData("startTime");
        const status = StatusCodeConvert(ctx.status);
        const msg = `{"action":"${ctx.protocol}","code":"${status}","startTime":"${startTime}","duration":"${
            now - lodash.toInteger(startTime) || 0
        }","traceId":"${ext.currTraceId}","endTime":"${now}","path":"${originalPath}"}`;
        Logger[status > 0 ? "Error" : "Info"](msg);
        // ctx = null;
    };
    ctx.res.once("finish", finish);
    // !!! TS报错，暂未处理
    // 需要重构gRPC ，支持websocket
    // ctx.rpc.call.on("error", finish);

    // try /catch
    const response: any = {};
    try {
        if (!ext.termined) {
            response.timeout = null;
            // promise.race
            await Promise.race([
                new Promise((resolve, reject) => {
                    response.timeout = setTimeout(reject, timeout, new Exception("APIERR_TIMEOUT", "Deadline exceeded"));
                    return;
                }),
                await next()
            ]);
        }

        if (ctx.body !== undefined && ctx.status === 404) {
            ctx.status = 200;
        }
        if (ctx.rpc.callback) {
          ctx.rpc.callback(null, ctx.body);
        }
        return null;
    } catch (err: any) {
        return await catcher(err, ctx);
    } finally {
        ctx.res.emit("finish");
        clearTimeout(response.timeout);
    }
}
