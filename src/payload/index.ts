/**
 * @ Author: Hanrea
 * @ version: 2022-03-21 13:14:21
 * @ copyright: Vecmat (c) - <hi(at)vecmat.com>
 */
import Koa from "koa";
import { Parse } from "./parse.js";
import { Logger } from "../base/Logger.js";
import { ARROBJ, Check } from "@vecmat/vendor";
import { Kirinriki } from "../core/Application.js";
import { IContext, INext } from "../core/IContext.js";
/**
 *
 *
 * @interface DefaultOptions
 */
export interface PayloadOptions {
    extTypes: {
        json: string[];
        form: string[];
        text: string[];
        multipart: string[];
        xml: string[];
    };
    limit: string;
    encoding: string;
    multiples: boolean;
    keepExtensions: boolean;
    length?: number;
}

/** @type {*} */
const defaultOptions: PayloadOptions = {
    extTypes: {
        json: ["application/json"],
        form: ["application/x-www-form-urlencoded"],
        text: ["text/plain"],
        multipart: ["multipart/form-data"],
        xml: ["text/xml"]
    },
    limit: "20mb",
    encoding: "utf-8",
    multiples: true,
    keepExtensions: true
};

/**
 *
 *
 * @export
 * @param {PayloadOptions} options
 * @param {*} app Kirinriki or Koa instance
 */
export function Payload(options: PayloadOptions, app: Kirinriki) {
    options = { ...defaultOptions, ...options };

    return async function PayloadSavant(ctx: IContext, next: INext) {
        /**
         * request query & params parser
         *
         * @param {any} name
         * @param {any} value
         * @returns
         */
        ARROBJ.defineProp(ctx, "queryParser", (): any => {
            let query = ctx.getMetaData("_query");
            if (!Check.isEmpty(query)) return query;
            query = { ...ctx.query, ...(ctx.params || {}) };
            ctx.setMetaData("_query", query);
            return query;
        });

        /**
         * request body parser
         *
         * @param {any} name
         * @param {any} value
         * @returns
         */
        ARROBJ.defineProp(ctx, "bodyParser", async (): Promise<any> => {
            let body = ctx.getMetaData("_body");
            if (!Check.isEmpty(body)) return body;

            try {
                const res = await Parse(ctx, options);
                body = res || {};
                ctx.setMetaData("_body", body);
                return body;
            } catch (err) {
                Logger.Error(err);
                return {};
            }
        });

        return next();
    };
}
