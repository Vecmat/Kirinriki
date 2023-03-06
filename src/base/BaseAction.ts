/**
 * @ Author: Hanrea
 * @ version: 2022-03-21 13:14:21
 * @ copyright: Vecmat (c) - <hi(at)vecmat.com>
 */

import "reflect-metadata";
import { Kirinriki } from "../core";
import { IAction } from "./Component";

/**
 * Base class
 *
 * @export
 * @class Base
 */
export class BaseAction implements IAction {
    readonly app: Kirinriki;

    /**
     * instance of BaseController.
     * @param {Kirinriki} app
     * @param {IContext} ctx
     * @memberof BaseController
     */
    protected constructor(...arg: any[]) {
        this.init(arg);
    }

    /**
     * init
     *
     * @protected
     * @memberof BaseController
     */
    protected init(...arg: any[]): void {}
}
