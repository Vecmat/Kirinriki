/**
 * @ Author: Hanrea
 * @ version: 2022-03-21 13:14:21
 * @ copyright: Vecmat (c) - <hi(at)vecmat.com>
 */


import { ACTION_SCOPT } from "../router/define.js"
import { IOCContainer } from "../container/index.js"
import type { IContext, Kirinriki } from "../core/index.js";



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
export function Action(scope?: string, identifier?: string): ClassDecorator {
    return (target: any) => {
        identifier = identifier || IOCContainer.getIdentifier(target);
        IOCContainer.saveClass("ACTION", target, identifier);
        IOCContainer.saveClassMetadata(ACTION_SCOPT, "scope", scope, target);
    };
}


/**
 * Interface for Mixture
 *
 */
export interface IAction {
    readonly scope?: TACTION_SCOPE;
    readonly app?: Kirinriki;
}

type TACTION_SCOPE = "CONNECT" | "GLOBAL"

/**
 * BaseMixture class
 *
 * @export
 * @class Base
 */
export abstract class BaseAction implements IAction {
    readonly app?: Kirinriki;
    public ctx?: IContext;
    readonly scope = "CONNECT";

    /**
     * instance of BaseMixture.
     * @param {Kirinriki} app
     * @param {IContext} ctx
     * @memberof BaseMixture
     */
    protected constructor(ctx: IContext, ...arg: any[]) {
        this.ctx = ctx;
        this.init(arg);
    }

    /**
     * init
     * @protected
     * @memberof BaseMixture
     */
    protected init(...arg: any[]): void {
        return;
    }
}
