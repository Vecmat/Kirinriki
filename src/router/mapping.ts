/**
 * @ Author: Hanrea
 * @ version: 2022-03-21 13:14:21
 * @ copyright: Vecmat (c) - <hi(at)vecmat.com>
 */
// tslint:disable-next-line: no-import-side-effect
// tslint:disable-next-line: no-import-side-effect
import "reflect-metadata";
import { Exception } from "@vecmat/vendor";
import { IOCContainer } from '../container';

export const ROUTER_KEY = Symbol("ROUTER_KEY"); 
export const MIXTURE_SCOPT = Symbol("MIXTURE_SCOPT"); 
export const CONTROLLER_ROUTER = Symbol("CONTROLLER_ROUTER"); 



/**
 * Kirinriki router options
 *
 * @export
 * @interface RouterOption
 */
export interface RouterOption {
    path?: string
    requestMethod: string
    routerName?: string
    method: string
}

/**
 * http request methods
 *
 * @export
 * @var RequestMethod
 */
export enum RequestMethod {
    "GET" = "get",
    "POST" = "post",
    "PUT" = "put",
    "DELETE" = "delete",
    "PATCH" = "patch",
    "ALL" = "all",
    "OPTIONS" = "options",
    "HEAD" = "head"
}

/**
 * Routes HTTP requests to the specified path.
 *
 * @param {string} [path="/"]
 * @param {RequestMethod} [reqMethod=RequestMethod.GET]
 * @param {{
 *         routerName?: string;
 *     }} [routerOptions={}]
 * @returns {*}  {MethodDecorator}
 */
export const Request = (
    path = "/",
    reqMethod: RequestMethod = RequestMethod.GET,
    routerOptions: {
        routerName?: string
    } = {}
): MethodDecorator => {
    const routerName = routerOptions.routerName ?? "";
    return (target, key: string, descriptor: PropertyDescriptor) => {
        const targetType = IOCContainer.getType(target);
        if (targetType !== "CONTROLLER") {
            throw  new Exception("BOOTERR_DEPRO_UNSUITED","Request decorator is only used in controllers class.");
        }
        // tslint:disable-next-line: no-object-literal-type-assertion
        IOCContainer.attachPropertyData(ROUTER_KEY, {
            path,
            requestMethod: reqMethod,
            routerName,
            method: key
        } as RouterOption, target, key);

        return descriptor;
    };
};

/**
 * Routes HTTP POST requests to the specified path.
 *
 * @param {string} path
 * @param {{
 *         routerName?: string;
 *     }} [routerOptions={}]
 * @returns {MethodDecorator}
 */
export const Post = (
    path = "/",
    routerOptions: {
        routerName?: string
    } = {}
): MethodDecorator => {
    return Request(path, RequestMethod.POST, routerOptions);
};

/**
 * Routes HTTP GET requests to the specified path.
 *
 * @param {string} path
 * @param {{
 *         routerName?: string;
 *     }} [routerOptions={}]
 * @returns {MethodDecorator}
 */
export const Get = (
    path = "/",
    routerOptions: {
        routerName?: string
    } = {}
): MethodDecorator => {
    return Request(path, RequestMethod.GET, routerOptions);
};

/**
 * Routes HTTP DELETE requests to the specified path.
 *
 * @param {string} path
 * @param {{
 *         routerName?: string;
 *     }} [routerOptions={}]
 * @returns {MethodDecorator}
 */
export const Delete = (
    path = "/",
    routerOptions: {
        routerName?: string
    } = {}
): MethodDecorator => {
    return Request(path, RequestMethod.DELETE, routerOptions);
};

/**
 * Routes HTTP PUT requests to the specified path.
 *
 * @param {string} path
 * @param {{
 *         routerName?: string;
 *     }} [routerOptions={}]
 * @returns {MethodDecorator}
 */
export const Put = (
    path = "/",
    routerOptions: {
        routerName?: string
    } = {}
): MethodDecorator => {
    return Request(path, RequestMethod.PUT, routerOptions);
};

/**
 * Routes HTTP PATCH requests to the specified path.
 *
 * @param {string} path
 * @param {{
 *         routerName?: string;
 *     }} [routerOptions={}]
 * @returns {MethodDecorator}
 */
export const Patch = (
    path = "/",
    routerOptions: {
        routerName?: string
    } = {}
): MethodDecorator => {
    return Request(path, RequestMethod.PATCH, routerOptions);
};

/**
 * Routes HTTP OPTIONS requests to the specified path.
 *
 * @param {string} path
 * @param {{
 *         routerName?: string;
 *     }} [routerOptions={}]
 * @returns {MethodDecorator}
 */
export const Options = (
    path = "/",
    routerOptions: {
        routerName?: string
    } = {}
): MethodDecorator => {
    return Request(path, RequestMethod.OPTIONS, routerOptions);
};

/**
 * Routes HTTP HEAD requests to the specified path.
 *
 * @param {string} path
 * @param {{
 *         routerName?: string;
 *     }} [routerOptions={}]
 * @returns {MethodDecorator}
 */
export const Head = (
    path = "/",
    routerOptions: {
        routerName?: string
    } = {}
): MethodDecorator => {
    return Request(path, RequestMethod.HEAD, routerOptions);
};

export const All = (
    path = "/",
    routerOptions: {
        routerName?: string
    } = {}
): MethodDecorator => {
    return Request(path, RequestMethod.ALL, routerOptions);
};

// todo User table list routers
export const Description = (
    name:string
): MethodDecorator => {
    return (target, key: string, descriptor: PropertyDescriptor) => {
        const targetType = IOCContainer.getType(target);
        if (targetType !== "CONTROLLER") {
            throw new Exception("BOOTERR_DEPRO_UNSUITED", "Description decorator is only used in controllers class.");
        }
        return descriptor;
    };
};
