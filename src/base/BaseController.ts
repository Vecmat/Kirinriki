/**
 * @ Author: Hanrea
 * @ version: 2022-03-21 13:14:21
 * @ copyright: Vecmat (c) - <hi(at)vecmat.com>
 */
import { Kirinriki, IContext } from '../core';
import { ApiInput, ApiOutput, IController } from './Component';

/**
 * Base controller
 *
 * @export
 * @class BaseController
 * @implements {IController}
 */
export  class BaseController implements IController {
    readonly app: Kirinriki;

    /**
     * instance of BaseController.
     * @param {Kirinriki} app
     * @param {IContext} ctx
     * @memberof BaseController
     */
    protected constructor( ...arg: any[]) {
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
