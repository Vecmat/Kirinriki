/**
 * @ Author: Hanrea
 * @ version: 2022-03-21 13:14:21
 * @ copyright: Vecmat (c) - <hi(at)vecmat.com>
 */
// tslint:disable-next-line: no-import-side-effect
import "reflect-metadata";
import { Middleware } from "koa";
import { IOCContainer } from "../container";
import { Exception } from "@vecmat/vendor";
import { Kirinriki, IContext, INext } from '../core';
import { MIXTURE_SCOPT, CONTROLLER_ROUTER } from "../router";


/**
 * Interface for Api input
 */
export interface ApiInput {
    code?: number // 错误码
    message?: string // 消息内容
    data?: any // 数据
}


/**
 * Interface for Api output
 */
export interface ApiOutput {
    code: number // 错误码
    message: string // 消息内容
    data: any // 数据
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
    readonly app: Kirinriki;

    __before?: (ctx: IContext) => Promise<any>;
    __behind?: (ctx: IContext) => Promise<any>;
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
 * Interface for Savant
 */
export interface ISavant {
    run: (options: any, app: Kirinriki) => Middleware;
}

/**
 * Indicates that an decorated class is a "savant".
 * 
 * @export
 * @param {string} [identifier] class name
 * @returns {ClassDecorator}
 */
export function Savant(identifier?: string): ClassDecorator {
    return (target: any) => {
        identifier = identifier || IOCContainer.getIdentifier(target);
        IOCContainer.saveClass("SAVANT", target, identifier);
    };
}


/**
 * Interface for Mixture
 * 
 */
export interface IMixture {
    readonly app: Kirinriki;
}

/**
 * Indicates that an decorated class is a "acton".
 *
 * @export
 * @param {string} [identifier] instce scope
 * @param {string} [identifier] class name
 * @returns {ClassDecorator}
 */
export function Mixture(scope?: string, identifier?: string): ClassDecorator {
    return (target: any) => {
        identifier = identifier || IOCContainer.getIdentifier(target);
        IOCContainer.saveClass("MIXTURE", target, identifier);
        IOCContainer.saveClassMetadata(MIXTURE_SCOPT, "scope", scope, target);
    };
}


