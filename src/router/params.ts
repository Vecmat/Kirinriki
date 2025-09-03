/**
 * @ Author: Hanrea
 * @ version: 2022-03-21 13:14:21
 * @ copyright: Vecmat (c) - <hi(at)vecmat.com>
 */

import { InjectParams } from "./inject.js";
import { IContext } from "../core/IContext.js";

/**
 * Get context.
 *
 * @export
 * @param {string} [name]
 * @returns
 */
export function Ctx(): ParameterDecorator {
    return InjectParams("Ctx", (ctx: IContext) => {
        return ctx;
    });
}

/**
 * Get Action for ctx.
 * ! 注意，改完后需要修改 Schedler 的引用
 */
export function Act(name: string): ParameterDecorator {
    return InjectParams("Act", (ctx: IContext) => {
        return ctx.getAction(name);
    });
}

/**
 * Get request header.
 *
 * @export
 * @param {string} [name]
 * @returns
 */
export function Header(name?: string): ParameterDecorator {
    return InjectParams("Header", (ctx: IContext) => {
        if (name !== undefined) {
            return ctx.get(name);
        }
        return ctx.headers;
    });
}

/**
 * Get path variable (take value from ctx.params).
 *
 * @export
 * @param {string} [name] params name
 * @returns
 */
export function Path(name?: string): ParameterDecorator {
    return InjectParams("Path", (ctx: IContext) => {
        const pathParams: any = ctx.params ?? {};
        if (name === undefined) {
            return pathParams;
        }
        return pathParams[name];
    });
}

/**
 * Get query-string parameters (take value from ctx.query).
 *
 * @export
 * @param {string} [name]
 * @returns
 */
export function Query(name?: string): ParameterDecorator {
    return InjectParams("Query", (ctx: IContext) => {
        const queryParams: any = ctx.query ?? {};
        if (name === undefined) {
            return queryParams;
        }
        return queryParams[name];
    });
}

/**
 * Get parsed upload file object.
 *
 * @export
 * @param {string} [name]
 * @returns
 */
export function File(name?: string): ParameterDecorator {
    return InjectParams("File", (ctx: IContext) => {
        return ctx.bodyParser().then((body: { file: Object }) => {
            const params: any = body.file ?? {};
            if (name === undefined) {
                return params;
            }
            return params[name];
        });
    });
}

/**
 * Get parsed POST/PUT... body.
 *
 * @export
 * @param {string} [name]
 * @returns
 */
export function Body(name?: string): ParameterDecorator {
    return InjectParams("Body", (ctx: IContext) => {
        return ctx.bodyParser().then((body: { post: Object }) => {
            const params: any = body.post ? body.post : body;
            if (name === undefined) {
                return params;
            }
            return params[name];
        });
    });
}

/**
 * Get POST/GET parameters, POST priority
 *
 * @export
 * @param {string} [name]
 * @returns {ParameterDecorator}
 */
export function Param(name?: string): ParameterDecorator {
    return InjectParams("Param", (ctx: IContext) => {
        return ctx.bodyParser().then((body: { post: Object }) => {
            const queryParams: any = ctx.queryParser() ?? {};
            const postParams: any = (body.post ? body.post : body) ?? {};
            if (name !== undefined) {
                return postParams[name] === undefined ? queryParams[name] : postParams[name];
            }
            return { ...queryParams, ...postParams };
        });
    });
}
