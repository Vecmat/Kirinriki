/**
 * @ Author: Hanrea
 * @ version: 2022-03-21 13:14:21
 * @ copyright: Vecmat (c) - <hi(at)vecmat.com>
 */

import "reflect-metadata";
import { IMixture } from "./Component";
import type { IContext, Kirinriki } from "../core";

/**
 * BaseMixture class
 * 
 * @export
 * @class Base
 */
export abstract class BaseMixture implements IMixture {
    public app: Kirinriki;
    public ctx?: IContext;
    public scope = "CONNECT";

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
