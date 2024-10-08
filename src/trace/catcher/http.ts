/**
 * @ Author: Hanrea
 * @ version: 2022-03-21 13:14:21
 * @ copyright: Vecmat (c) - <hi(at)vecmat.com>
 */
import { Stream } from "node:stream";
import { Exception } from "@vecmat/vendor";
import { Logger } from "../../base/Logger.js";
import { HttpStatusCodeMap } from "../code.js";

/**
 * HTTP error handler
 *
 * @export
 * @param {IContext} ctx
 * @param {Exception} err
 * @returns {*}
 */
export function HTTPCatcher<E extends Error>(ctx: any, err: E) {
    try {
        ctx.status = ctx.status || 500;
        if (!HttpStatusCodeMap.has(ctx.status)) ctx.status = 500;
        // todo: Get accepted file types(html、xml、json、txt...)
        // let contentType = "application/json";
        // if (ctx.encoding !== false) {
        //     contentType = `${contentType}; charset=${ctx.encoding}`;
        // }
        // ctx.type = contentType;
        // const msg = err.message || ctx.message || "";

        if (typeof ctx.body === "string") {
            return null;
        }
        if (ctx.body instanceof Stream) {
            return null;
        }

        if ("HEAD" === ctx.method && !ctx.body) {

            const body = {
                sign: err.name ,
                message: err.message,
                data: ctx.body || {}
            };
            ctx.body = body;
        }


        // `{"":${},"message":"${}","":${}}`;
        // ctx.set("Content-Length", `${Buffer.byteLength(JSON.stringify(body))}`);

        // ctx.res.end(JSON.stringify(body));
        return;
    } catch (error) {
        Logger.Error(error);
        return ctx.res.end("");
    }
}
