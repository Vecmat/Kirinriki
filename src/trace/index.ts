/**
 * @ Author: Hanrea
 * @ version: 2022-03-21 13:14:21
 * @ copyright: Vecmat (c) - <hi(at)vecmat.com>
 */
import * as Koa from "koa";
import { v4 as uuidv4 } from "uuid";
import { Kirinriki, IContext, INext } from "../core";
import { asyncLocalStorage, createAsyncResource, wrapEmitter } from "./wrap";
import { httpRunner } from "./runner/http";
import { grpcRunner } from "./runner/grpc";
import { wsRunner } from "./runner/ws";
import { respond } from "./respond";

/**
 * GetTraceId
 *
 * @export
 * @returns {*}
 */
export function GetTraceId() {
    return asyncLocalStorage.getStore();
}

/**
 * TraceOptions
 *
 * @export
 * @interface TraceOptions
 */
export interface TraceOptions {
    HeaderName: string;
    IdFactory: any;
}

/**
 * defaultOptions
 */
const defaultOptions = {
    HeaderName: "X-Request-Id",
    IdFactory: uuidv4
};

/**
 * Trace savant
 *
 * @param {TraceOptions} options
 * @param {Kirinriki} app
 * @returns {*}  {Koa.Middleware}
 */
export function Trace(options: TraceOptions, app: Kirinriki): Koa.Middleware {
    options = { ...defaultOptions, ...options };
    const headerName = options.HeaderName.toLowerCase();
    const timeout = (app.config("http_timeout") || 10) * 1000;
    const encoding = app.config("encoding") || "utf-8";
    const openTrace = app.config("open_trace") || false;
    return async (ctx: IContext, next: INext) => {
        // server termined
        const termined = false;
        const respWapper = async (currTraceId: string) => {
            // metadata
            ctx.setMetaData(options.HeaderName, currTraceId);
            if (ctx.protocol === "grpc") {
                // allow bypassing koa
                ctx.respond = false;
                ctx.rpc.call.metadata.set(options.HeaderName, currTraceId);
                await grpcRunner(ctx, next, { timeout, currTraceId, encoding, termined });
            } else if (ctx.protocol === "ws" || ctx.protocol === "wss") {
                // allow bypassing koa
                ctx.respond = false;
                ctx.set(options.HeaderName, currTraceId);
                await wsRunner(ctx, next, { timeout, currTraceId, encoding, termined });
            } else {
                // response header
                ctx.set(options.HeaderName, currTraceId);
                await httpRunner(ctx, next, { timeout, currTraceId, encoding, termined });
            }
            return respond(ctx);
        };

        let currTraceId = options.IdFactory();
        if (openTrace) {
            if (ctx.protocol === "grpc") {
                const request: any = ctx.getMetaData("_body") || {};
                currTraceId = `${ctx.getMetaData(headerName)}` || <string>request[headerName];
            } else {
                currTraceId = <string>ctx.headers[headerName] || <string>ctx.query[headerName];
            }
            currTraceId = currTraceId || `VM-KRNRK-${options.IdFactory()}`;

            return asyncLocalStorage.run(currTraceId, () => {
                const asyncResource = createAsyncResource();
                wrapEmitter(ctx.req, asyncResource);
                wrapEmitter(ctx.res, asyncResource);
                return respWapper(currTraceId);
            });
        }

        return respWapper(currTraceId);
    };
}
