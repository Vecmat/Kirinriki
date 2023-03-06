/**
 * @ Author: Hanrea
 * @ version: 2022-03-21 13:14:21
 * @ copyright: Vecmat (c) - <hi(at)vecmat.com>
 */
import { catcher } from "../catcher";
import { IContext } from "../../core";
import { StatusCodeConvert } from "../code";
import { Helper, Exception } from "@vecmat/vendor";
import { DefaultLogger as Logger } from "@vecmat/printer";

/**
 * grpcRunner
 *
 * @param {Kirinriki} app
 * @returns {*}
 */
export async function grpcRunner(ctx: IContext, next: Function, ext?: any): Promise<any> {
    const timeout = ext.timeout || 10000;
    // set ctx start time
    const startTime = Date.now();
    ctx.setMetaData("startTime", `${startTime}`);

    ctx.rpc.call.metadata.set("X-Powered-By", "Kirinriki");
    ctx.rpc.call.sendMetadata(ctx.rpc.call.metadata);

    // event callback
    const listener = () => {
        const now = Date.now();
        const originalPath = ctx.getMetaData("originalPath");
        const startTime = ctx.getMetaData("startTime");
        const status = StatusCodeConvert(ctx.status);
        const msg = `{"action":"${ctx.protocol}","code":"${status}","startTime":"${startTime}","duration":"${
            now - Helper.toInt(startTime) || 0
        }","traceId":"${ext.currTraceId}","endTime":"${now}","path":"${originalPath}"}`;
        Logger[status > 0 ? "Error" : "Info"](msg);
        // ctx = null;
    };
    ctx.res.once("finish", listener);
    ctx.rpc.call.once("error", listener);

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
                next()
            ]);
        }

        if (ctx.body !== undefined && ctx.status === 404) {
            ctx.status = 200;
        }

        ctx.rpc.callback(null, ctx.body);
        return null;
    } catch (err: any) {
        return await catcher(err, ctx);
    } finally {
        // !? gRPC不应该是长连接么？
        ctx.res.emit("finish");
        clearTimeout(response.timeout);
    }
}
