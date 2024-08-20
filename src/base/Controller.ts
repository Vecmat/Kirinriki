/**
 * @ Author: Hanrea
 * @ version: 2022-03-21 13:14:21
 * @ copyright: Vecmat (c) - <hi(at)vecmat.com>
 */



import { IContext } from "../core/IContext.js";
import { Kirinriki } from "../core/Application.js";
import { CONTROLLER_ROUTER } from "../router/define.js";
import { IOCContainer } from "../container/Container.js";

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
 * Base controller
 *
 * @export
 * @class BaseController
 * @implements {IController}
 */
export  class BaseController implements IController {
    readonly app!: Kirinriki;

    /**
     * instance of BaseController.
     * @param {Kirinriki} app
     * @param {IContext} ctx
     * @memberof BaseController
     */
    protected constructor(...arg: any[]) {
        this.init(...arg);
    }

    /**
     * init
     *
     * @protected
     * @memberof BaseController
     */
    protected init(...arg: any[]): void {}




}
