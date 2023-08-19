/**
 * @ Author: Hanrea
 * @ version: 2022-03-21 13:14:21
 * @ copyright: Vecmat (c) - <hi(at)vecmat.com>
 */

import lodash from "lodash";
import { getParamter } from "./params";
import { Logger } from "../base/Logger";
import { Kirinriki, IContext } from "../core";
import { CONTROLLER_ROUTER, ROUTER_KEY } from "./mapping";
import { getOriginMetadata, IOCContainer, RecursiveGetMetadata, TAGGED_PARAM } from "../container";
import { PARAM_CHECK_KEY, PARAM_RULE_KEY, PARAM_TYPE_KEY, ValidOtpions, ValidRules } from "../validation";

/**
 * controller handler
 *
 * @param {Kirinriki} app
 * @param {IContext} ctx
 * @param {*} ctl
 * @param {*} method
 * @param {*} ctlParams
 * @returns
 */
export async function Handler(app: Kirinriki, ctx: IContext, ctl: any, method: string, ctlParams: any) {
    if (!ctx || !ctl) {
        // ! todo 需要转为 Exception抛出
        return ctx.throw(404, `Controller not found.`);
    }
    if (!ctl.ctx) {
        ctl.ctx = ctx;
    }
    // inject param
    let args = [];
    if (ctlParams) {
        args = await getParamter(app, ctx, ctlParams);
    }
    // method
    const res = await ctl[method](...args);
    ctx.body = ctx.body || res;
}

/**
 *
 *
 * @interface RouterMetadata
 */
interface RouterMetadata {
    method: string;
    path: string;
    requestMethod: string;
    routerName: string;
}

/**
 *
 *
 * @interface RouterMetadataObject
 */
interface RouterMetadataObject {
    [key: string]: RouterMetadata;
}

/**
 *
 *
 * @param {Kirinriki} app
 * @param {*} target
 * @param {*} [instance]
 * @returns {*}
 */
export function injectRouter(app: Kirinriki, target: any, instance?: any): RouterMetadataObject {
    // Controller router path
    let path = "";
    const metaDatas = IOCContainer.listPropertyData(CONTROLLER_ROUTER, target);
    const identifier = IOCContainer.getIdentifier(target);
    if (metaDatas) {
        path = metaDatas[identifier] ?? "";
    }
    path = path.startsWith("/") || path === "" ? path : `/${path}`;

    const rmetaData = RecursiveGetMetadata(ROUTER_KEY, target);
    const router: RouterMetadataObject = {};
    // tslint:disable-next-line: forin
    for (const metaKey in rmetaData) {
        // Logger.Debug(`Register inject method Router key: ${metaKey} => value: ${JSON.stringify(rmetaData[metaKey])}`);
        //.sort((a, b) => b.priority - a.priority)
        for (const val of rmetaData[metaKey]) {
            const tmp = {
                ...val,
                path: `${path}${val.path}`.replace("//", "/")
            };
            router[`${tmp.path}||${tmp.requestMethod}`] = tmp;
        }
    }

    return router;
}

/**
 *
 *
 * @interface ParamMetadata
 */
export interface ParamMetadata {
    fn: any;
    name: string;
    index: number;
    clazz: any;
    type: string;
    isDto: boolean;
    rule: Function | ValidRules | ValidRules[];
    options: ValidOtpions;
    dtoCheck: boolean;
    dtoRule: any;
}

/**
 *
 *
 * @interface ParamMetadataObject
 */
export interface ParamMetadataObject {
    [key: string]: ParamMetadata[];
}

/**
 *
 *
 * @param {Kirinriki} app
 * @param {*} target
 * @param {*} [instance]
 * @returns {*}
 */
export function injectParam(app: Kirinriki, target: any, instance?: any): ParamMetadataObject {
    instance = instance || target.prototype;
    const metaDatas = RecursiveGetMetadata(TAGGED_PARAM, target);
    const validMetaDatas = RecursiveGetMetadata(PARAM_RULE_KEY, target);
    const validatedMetaDatas = RecursiveGetMetadata(PARAM_CHECK_KEY, target);
    const argsMetaObj: ParamMetadataObject = {};
    for (const meta in metaDatas) {
        // 实例方法带规则形参必须小于等于原型形参(如果不存在验证规则，则小于)
        if (instance[meta] && instance[meta].length <= metaDatas[meta].length) {
            Logger.Debug(
                `Register inject param key ${IOCContainer.getIdentifier(target)}: ${lodash.toString(meta)} => value: ${JSON.stringify(
                    metaDatas[meta]
                )}`
            );

            // cover to obj
            const data: ParamMetadata[] = (metaDatas[meta] ?? []).sort((a: ParamMetadata, b: ParamMetadata) => a.index - b.index);
            const validData = validMetaDatas[meta] ?? [];
            data.forEach((v: ParamMetadata) => {
                validData.forEach((it: any) => {
                    if (v.index === it.index && it.name === v.name) {
                        v.rule = it.rule;
                        v.options = it.options;
                    }
                });
                if (v.type) {
                    v.type = v.isDto ? v.type : v.type.toLowerCase();
                }
                v.dtoCheck = !!validatedMetaDatas[meta]?.dtoCheck;
                if (v.isDto) {
                    v.clazz = IOCContainer.getClass(v.type, "COMPONENT");
                    if (v.dtoCheck) {
                        v.dtoRule = {};
                        const originMap = getOriginMetadata(PARAM_TYPE_KEY, v.clazz);
                        for (const [key, type] of originMap) {
                            v.dtoRule[key] = type;
                        }
                        v.clazz.prototype["_typeDef"] = v.dtoRule;
                    }
                }
            });
            argsMetaObj[meta] = data;
        }
    }
    return argsMetaObj;
}
