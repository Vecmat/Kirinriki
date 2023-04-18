/**
 * @ Author: Hanrea
 * @ version: 2022-03-21 13:14:21
 * @ copyright: Vecmat (c) - <hi(at)vecmat.com>
 */
import { Kirinriki, IContext } from '../core';
import { formatApiData } from './widget';
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
    readonly ctx: IContext;

    /**
     * instance of BaseController.
     * @param {Kirinriki} app
     * @param {IContext} ctx
     * @memberof BaseController
     */
    protected constructor(ctx: IContext, ...arg: any[]) {
        this.ctx = ctx;
        this.init(arg);
    }

    /**
     * init
     *
     * @protected
     * @memberof BaseController
     */
    protected init(...arg: any[]): void {}

    /**
     * Response to normalize json format content for success
     *
     * @param {(string | ApiInput)} msg   待处理的message消息
     * @param {*} [data]    待处理的数据
     * @param {number} [code=200]    错误码，默认0
     * @returns {*}
     * @memberof BaseController
     */
    public ok(msg: string | ApiInput, data?: any, code = 0) {
        const obj: ApiOutput = formatApiData(msg, data, code);
        return Promise.resolve(obj);
    }

    /**
     * Response to normalize json format content for fail
     *
     * @param {(string | ApiInput)} msg
     * @param {*} [data]
     * @param {number} [code=1]
     * @returns {*}
     * @memberof BaseController
     */
    public fail(msg: Error | string | ApiInput, data?: any, code = 1) {
        const obj: ApiOutput = formatApiData(msg, data, code);
        this.ctx.body = obj.data;
        // todo 处理错误格式化（json、html、XML)
        this.ctx.throw(obj.message, obj.code, 200);
    }
}
