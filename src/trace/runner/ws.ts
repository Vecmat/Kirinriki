/**
 * @ Author: Hanrea
 * @ version: 2022-03-21 13:14:21
 * @ copyright: Vecmat (c) - <hi(at)vecmat.com>
 */
import { inspect } from "util";
import { catcher } from "../catcher";
import { IContext, INext } from "../../core";
import { Logger } from "../../base/Logger";
import { Exception,  ARROBJ } from "@vecmat/vendor";

/**
 * wsRunner
 *
 * @param {IContext} ctx 
 * @param {Function} next 
 * @param {*} ext 
 * @returns 
 */
export async function wsRunner(ctx: IContext, next: INext, ext?: any): Promise<any> {
    const timeout = ext.timeout || 10000;

    // set ctx start time
    ARROBJ.defineProp(ctx, "startTime", Date.now());
    // http version
    ARROBJ.defineProp(ctx, "version", ctx.req.httpVersion);
    // originalPath
    ARROBJ.defineProp(ctx, "originalPath", ctx.path);
    // Encoding
    ctx.encoding = ext.encoding;
    // auto send security header
    ctx.set("X-Powered-By", "Kirinriki");
    ctx.set("X-Content-Type-Options", "nosniff");
    ctx.set("X-XSS-Protection", "1;mode=block");

    // after send message event
    const listener = () => {
        const now = Date.now();
        const msg = `{"action":"${ctx.protocol}","code":"${ctx.status}","startTime":"${ctx.startTime}","duration":"${
            now - ctx.startTime || 0
        }","traceId":"${ext.currTraceId}","endTime":"${now}","path":"${ctx.originalPath || "/"}"}`;
        Logger[ctx.status >= 400 ? "Error" : "Info"](msg);
        // ctx = null;
    };
    ctx.res.once("finish", listener);

    // ctx.websocket.once("error", listener);
    // ctx.websocket.once("connection", () => {
    //     Logger.Info("websocket connected");
    // });
    // ctx.websocket.once("close", (socket: any, code: number, reason: Buffer) => {
    //     Logger.Error("websocket closed: ", lodash.toString(reason));
    // });

    // try /catch
    const response: any = ctx.res;
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
        // if (ctx.status >= 400) {
        //     throw new Exception('KRNRK_SERVER_ERROR', "Server error");
        // }
        ctx.websocket.send(inspect(ctx.body || ""), null);
        return null;
    } catch (err: any) {
        return await catcher(err, ctx);
    } finally {
        ctx.res.emit("finish");
        clearTimeout(response.timeout);
    }
}
