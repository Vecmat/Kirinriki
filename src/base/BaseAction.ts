/**
 * @ Author: Hanrea
 * @ version: 2022-03-21 13:14:21
 * @ copyright: Vecmat (c) - <hi(at)vecmat.com>
 */

import "reflect-metadata";
import { IAction } from "./Component";
import type { IContext, Kirinriki } from "../core";

/**
 * BaseAction class
 * 
 * @export
 * @class Base
 */
export abstract class BaseAction implements IAction {
    public app: Kirinriki;
    public ctx :IContext;
    public scope = "CONNECT";


    /**
     * instance of BaseAction.
     * @param {Kirinriki} app
     * @param {IContext} ctx
     * @memberof BaseAction
     */
    protected constructor(ctx:IContext,...arg: any[]) {
        this.ctx = ctx;
        this.init(arg);
    }

    /**
     * init
     * todo 改成虚函数？
     * @protected
     * @memberof BaseAction
     */
    protected init(...arg: any[]): void {
        return;
    }
}
