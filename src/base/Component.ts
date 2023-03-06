/**
 * @ Author: Hanrea
 * @ version: 2022-03-21 13:14:21
 * @ copyright: Vecmat (c) - <hi(at)vecmat.com>
 */
// tslint:disable-next-line: no-import-side-effect
import "reflect-metadata";
import { Kirinriki, IContext, INext } from '../core';
import { CONTROLLER_ROUTER } from "../router";
import { IOCContainer } from "../container";
import { Exception } from "@vecmat/vendor";
import { CAPTURER_KEY } from "./Constants";


/**
 * Interface for Api output
 */
export interface ApiOutput {
    code: number // 错误码
    message: string // 消息内容
    data: any // 数据
}

/**
 * Interface for Api input
 */
export interface ApiInput {
    code?: number // 错误码
    message?: string // 消息内容
    data?: any // 数据
}

/**
 * Indicates that an decorated class is a "component".
 *
 * @export
 * @param {string} [identifier] component name
 * @returns {ClassDecorator}
 */
export function Component(identifier?: string): ClassDecorator {
    return (target: any) => {
        identifier = identifier || IOCContainer.getIdentifier(target);
        IOCContainer.saveClass("COMPONENT", target, identifier);
    };
}


/**
 * Interface for Controller
 */
export interface IController {
    readonly app: Kirinriki
    readonly ctx: IContext
    __befor?: () => Promise<any>
    __after?: () => Promise<any>
}

/**
 * Indicates that an decorated class is a "controller".
 *
 * @export
 * @param {string} [path] controller router path
 * @returns {ClassDecorator}
 */
export function Controller(path = ""): ClassDecorator {
    return (target: any) => {
        const identifier = IOCContainer.getIdentifier(target);
        IOCContainer.saveClass("CONTROLLER", target, identifier);
        IOCContainer.savePropertyData(CONTROLLER_ROUTER, path, target, identifier);
    };
}


/**
 * Interface for Middleware
 */
export type KirinrikiMiddleware = (ctx: IContext, next: INext) => Promise<any>

/**
 * Interface for Middleware
 */
export interface IMiddleware {
    run: (options: any, app: Kirinriki) => KirinrikiMiddleware
}

/**
 * Indicates that an decorated class is a "middleware".
 *
 * @export
 * @param {string} [identifier] class name
 * @returns {ClassDecorator}
 */
export function Middleware(identifier?: string): ClassDecorator {
    return (target: any) => {
        identifier = identifier || IOCContainer.getIdentifier(target);
        IOCContainer.saveClass("MIDDLEWARE", target, identifier);
    };
}


/**
 * Interface for Service
 */
export interface IAction {
    readonly app: Kirinriki
}
/**
 * Indicates that an decorated class is a "acton".
 *
 * @export
 * @param {string} [identifier] class name
 * @returns {ClassDecorator}
 */
export function Action(identifier?: string): ClassDecorator {
    return (target: any) => {
        identifier = identifier || IOCContainer.getIdentifier(target);
        IOCContainer.saveClass("ACTION", target, identifier);
    };
}



/**
 * Indicates that an decorated class is a "capturer".
 *
 * @export 
 * @param {string} [identifier] class name
 * @returns {ClassDecorator}
 */
export function Capturer(identifier?: string): ClassDecorator {
    return (target: any) => {
        identifier = identifier || IOCContainer.getIdentifier(target);
        IOCContainer.saveClass("CAPTURER", target, identifier);
    };
}


/**
 * Register error capture function
 * @example @Catching("*")
 * @example @Catching("Sequlize*")
 * @param name  ErrorType for matching (support '*' match any char )
 * @returns 
 */
export function Catching(name: string): MethodDecorator {
    return (target, propertyKey: string, descriptor: PropertyDescriptor) => {
        IOCContainer.savePropertyData(CAPTURER_KEY, name, target, propertyKey);
    };
}

/**
 * Interface for Plugin
 */
export interface IPlugin {
    run: (options: any, app: Kirinriki) => Promise<any>
}
/**
 * Indicates that an decorated class is a "plugin".
 *
 * @export
 * @param {string} [identifier] class name
 * @returns {ClassDecorator}
 */
export function Plugin(identifier?: string): ClassDecorator {
    return (target: any) => {
        identifier = identifier || IOCContainer.getIdentifier(target);
        if (!identifier.endsWith("Plugin")) {
            throw new Exception("BOOTERR_LOADER_NAMELACK","Plugin class name must be 'Plugin' suffix.");
        }
        IOCContainer.saveClass("COMPONENT", target, `${identifier}`);
    };
}

