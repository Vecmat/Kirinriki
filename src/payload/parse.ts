/**
 * @ Author: Hanrea
 * @ version: 2022-03-21 13:14:21
 * @ copyright: Vecmat (c) - <hi(at)vecmat.com>
 */
import fs from "fs";
import util from "util";
import qs from "querystring";
import inflate from "inflation";
import getRawBody from "raw-body";
import onFinished from "on-finished";
import { PayloadOptions } from "./index";
import { parseStringPromise } from "xml2js";
import { IncomingForm, BufferEncoding } from "formidable";
const fsUnlink = util.promisify(fs.unlink);
const fsAccess = util.promisify(fs.access);
/**
 *
 *
 * @export
 * @param {*} ctx
 * @param {*} options
 * @returns {*}
 */
export function Parse(ctx: any, options: PayloadOptions) {
    const methods = ["POST", "PUT", "DELETE", "PATCH", "LINK", "UNLINK"];
    if (methods.every((method: string) => ctx.method !== method)) return Promise.resolve({});

    // defaults
    const len = ctx.req.headers["content-length"];
    const encoding = ctx.req.headers["content-encoding"] || "identity";
    if (len && encoding === "identity") options.length = ~~len;

    options.encoding = options.encoding || "utf8";
    options.limit = options.limit || "1mb";

    if (ctx.request.is(options.extTypes.form)) return parseForm(ctx, options);

    if (ctx.request.is(options.extTypes.multipart)) return parseMultipart(ctx, options);

    if (ctx.request.is(options.extTypes.json)) return parseJson(ctx, options);

    if (ctx.request.is(options.extTypes.text)) return parseText(ctx, options);

    if (ctx.request.is(options.extTypes.xml)) return parseXml(ctx, options);

    return Promise.resolve({});
}

/**
 * parse form
 *
 * @param {*} ctx
 * @param {PayloadOptions} opts
 * @returns {*}
 */
function parseForm(ctx: any, opts: PayloadOptions) {
    return parseText(ctx, opts)
        .then((str: string) => qs.parse(str))
        .then((data: any) => ({ post: data }));
}

/**
 * parse multipart
 *
 * @param {*} ctx
 * @param {PayloadOptions} opts
 * @returns {*}
 */
function parseMultipart(ctx: any, opts: PayloadOptions) {
    const form = new IncomingForm({
        encoding: <BufferEncoding>opts.encoding,
        multiples: opts.multiples,
        keepExtensions: opts.keepExtensions
    });

    let uploadFiles: any = null;
    onFinished(ctx.res, () => {
        if (!uploadFiles) return;

        Object.keys(uploadFiles).forEach((key: string) => {
            fsAccess(uploadFiles[key].path)
                .then(() => fsUnlink(uploadFiles[key].path))
                .catch(() => {});
        });
    });
    return new Promise((resolve, reject) => {
        form.parse(ctx.req, (err: any, fields: any, files: any) => {
            if (err) return reject(err);

            uploadFiles = files;
            return resolve({
                post: fields,
                file: files
            });
        });
    });
}

/**
 * parse json
 *
 * @param {*} ctx
 * @param {PayloadOptions} opts
 * @returns {*}
 */
function parseJson(ctx: any, opts: PayloadOptions) {
    return parseText(ctx, opts)
        .then((str: string) => JSON.parse(str))
        .then((data: any) => ({ post: data }));
}

/**
 * parse text
 *
 * @param {*} ctx
 * @param {PayloadOptions} opts
 * @returns {*}  {Promise<string>}
 */
function parseText(ctx: any, opts: PayloadOptions): Promise<string> {
    return new Promise((resolve, reject) => {
        getRawBody(inflate(ctx.req), opts, (err: any, body: string) => {
            if (err) reject(err);

            resolve(body);
        });
    });
}

/**
 * parse xml
 *
 * @param {*} ctx
 * @param {PayloadOptions} opts
 * @returns {*}
 */
function parseXml(ctx: any, opts: PayloadOptions) {
    return parseText(ctx, opts)
        .then((str: string) => parseStringPromise(str))
        .then((data: any) => ({ post: data }));
}
