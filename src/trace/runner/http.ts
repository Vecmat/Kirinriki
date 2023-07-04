/**
 * @ Author: Hanrea
 * @ version: 2022-03-21 13:14:21
 * @ copyright: Vecmat (c) - <hi(at)vecmat.com>
 */
import { catcher } from "../catcher";
import { IContext } from "../../core";
import { Exception, ARROBJ } from "@vecmat/vendor";
import { DefaultLogger as Logger } from "@vecmat/printer";
import { Stream } from "stream";


/**
 * httpRunner
 *
 * @param {Kirinriki} app
 * @returns {*}
 */
export async function httpRunner(ctx: IContext, next: Function, ext?: any): Promise<any> {
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

    // response finish
    ctx.res.once("finish", () => {
        const now = Date.now();
        const msg = `{"action":"${ctx.method}","code":"${ctx.status}","startTime":"${ctx.startTime}","duration":"${
            now - ctx.startTime || 0
        }","traceId":"${ext.currTraceId}","endTime":"${now}","path":"${ctx.originalPath || "/"}"}`;
        Logger[ctx.status >= 400 ? "Error" : "Info"](msg);
        // ctx = null;
    });

    // try /catch
    const response: any = ctx.res;
    try {
        // todo 移到handler内处理,还需要处理渲染问题
        // 交给应用处理？？
        // if (app.server.status === 503) {
        //     ctx.status = 503;
        //     ctx.set('Connection', 'close');
        //     ctx.body = 'Server is in the process of shutting down';
        //     termined = true;
        // }

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

        // 改为默认
        // if (ctx.body !== undefined && ctx.status === 404) {
        //     ctx.status = 200;
        // }
        // 程序可分开控制状态码和内容才对
        // if (ctx.status >= 400) {
        //     throw new Exception('KRNRK_SERVER_ERROR', "Server error");
        // }
        // todo 应该放入 runner 的 finally处理中
        if (typeof ctx.body === "string") {
            return null;
        }
         if (ctx.body instanceof Stream) {
             return null;
         }
        const body = {
            sign: "SUCCESS",
            message: "请求处理正常",
            data: ctx.body || {}
        };
        // `{"":${},"message":"${}","":${}}`;
        // ctx.set("Content-Length", `${Buffer.byteLength(JSON.stringify(body))}`);
    
        ctx.body = body;
        return null;
    } catch (err: any) {
        // skip prevent errors
        return await catcher(err, ctx);
    } finally {
        clearTimeout(response.timeout);
    }
}
