/**
 * @ Author: Hanrea
 * @ version: 2022-03-21 13:14:21
 * @ copyright: Vecmat (c) - <hi(at)vecmat.com>
 */
// tslint:disable-next-line: no-import-side-effect
// tslint:disable-next-line: no-import-side-effect
import "reflect-metadata";
import { Exception } from "@vecmat/vendor";
import { RequestMethod } from "./define.js";
import { InjectRouter } from "./inject.js";
import { IOCContainer } from "../container/index.js";


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
    return InjectRouter(path, RequestMethod.POST, routerOptions);
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
    return InjectRouter(path, RequestMethod.GET, routerOptions);
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
    return InjectRouter(path, RequestMethod.DELETE, routerOptions);
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
    return InjectRouter(path, RequestMethod.PUT, routerOptions);
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
    return InjectRouter(path, RequestMethod.PATCH, routerOptions);
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
    return InjectRouter(path, RequestMethod.OPTIONS, routerOptions);
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
    return InjectRouter(path, RequestMethod.HEAD, routerOptions);
};

export const All = (
    path = "/",
    routerOptions: {
        routerName?: string
    } = {}
): MethodDecorator => {
    return InjectRouter(path, RequestMethod.ALL, routerOptions);
};


// export const WS ={}
// export const GRPC ={}



// todo: User table list routers description
export const Description = (
    name:string
): MethodDecorator => {
    return (target: Object, method: string | symbol, descriptor: PropertyDescriptor) => {
        const targetType = IOCContainer.getType(target);
        if (targetType !== "CONTROLLER") {
            throw new Exception("BOOTERR_DEPRO_UNSUITED", "Description decorator is only used in controllers class.");
        }
        return descriptor;
    };
};
