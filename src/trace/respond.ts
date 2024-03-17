/**
 * @ Author: Hanrea
 * @ version: 2022-03-21 13:14:21
 * @ copyright: Vecmat (c) - <hi(at)vecmat.com>
 */

import { Stream } from "stream";
import { IContext } from "../core/IContext.js";

// StatusEmpty
const StatusEmpty = [204, 205, 304];
/**
 * Response helper.
 * A copy of koa respond: https://github.com/koajs/koa/blob/aa816ca523e0f7f3ca7623163762a2e63a7b0ee3/lib/application.js#L220
 *
 * @param {IContext} ctx
 * @returns {*}
 */
export function respond(ctx: IContext) {
    // allow bypassing koa
    if (!ctx.writable) return;
    if (false === ctx.respond) return;

    let body = ctx.body;
    const res = ctx.res;
    const code = ctx.status;

    // ignore body
    if (StatusEmpty.includes(code)) {
        // strip headers
        ctx.body = null;
        return res.end();
    }

    if ("HEAD" === ctx.method) {
        if (!res.headersSent && !(<any>ctx.response).has("Content-Length")) {
            const { length } = ctx.response;
            if (Number.isInteger(length)) ctx.length = length;
        }
        return res.end();
    }

    // status body
    if (null == body) {
        if ((<any>ctx.response)._explicitNullBody) {
            ctx.response.remove("Content-Type");
            ctx.response.remove("Transfer-Encoding");
            return res.end();
        }
        if (ctx.req.httpVersionMajor >= 2) {
            body = String(code);
        } else {
            body = ctx.message || String(code);
        }
        if (!res.headersSent) {
            ctx.type = "text";
            ctx.length = Buffer.byteLength(<string>body);
        }
        return res.end(body);
    }

    // status
    if (code === 404) {
        ctx.status = 200;
    }

    // responses
    if (Buffer.isBuffer(body)) return res.end(body);
    if ("string" === typeof body) return res.end(body);
    if (body instanceof Stream) return (<Stream>body).pipe(res);

    // body: json
    body = JSON.stringify(body);
    if (!res.headersSent) {
        ctx.length = Buffer.byteLength(<string>body);
    }
    res.end(body);
}
