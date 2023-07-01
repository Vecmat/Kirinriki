/**
 * @ Author: Hanrea
 * @ version: 2022-03-21 13:14:21
 * @ copyright: Vecmat (c) - <hi(at)vecmat.com>
 */
import { Exception } from "@vecmat/vendor";
import { Logger } from "../../base/Logger";
import { HttpStatusCode, HttpStatusCodeMap } from "../code";

/**
 * HTTP error handler
 *
 * @export
 * @param {IContext} ctx
 * @param {Exception} err
 * @returns {*}
 */
export function HTTPCatcher(ctx: any, err: Exception) {
    try {
        ctx.status = ctx.status || 500;
        if (!HttpStatusCodeMap.has(ctx.status)) ctx.status = 500;
        // todo 检查请求文件类型，html、xml、json、txt
        // let contentType = "application/json";
        // if (ctx.encoding !== false) {
        //     contentType = `${contentType}; charset=${ctx.encoding}`;
        // }
        // 分别处理
        // ctx.type = contentType;
        // const msg = err.message || ctx.message || "";

        // todo 应该放入 runner 的 finally处理中
        const body = {
            sign: err.sign,
            message: err.message,
            data: ctx.body || {}
        };
        // `{"":${},"message":"${}","":${}}`;
        // ctx.set("Content-Length", `${Buffer.byteLength(JSON.stringify(body))}`);
        ctx.body = body;
        // ctx.res.end(JSON.stringify(body));
        return;
    } catch (error) {
        Logger.Error(error);
        // 返回错误ID
        ctx.set("Vecmat-Error-id", `server error id:190128302483}`);
        return ctx.res.end("");
    }
}
