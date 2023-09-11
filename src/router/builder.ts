/**
 * @ Author: Hanrea
 * @ version: 2022-03-21 13:14:21
 * @ copyright: Vecmat (c) - <hi(at)vecmat.com>
 */

import lodash from "lodash";
import { getParamter } from "./widget";
import { Logger } from "../base/Logger";
import { Exception } from "@vecmat/vendor";
import { Kirinriki, IContext } from "../core";
import { ASPECT_BEFORE, ASPECT_BEHIND, CONTROLLER_ROUTER, ParamMetadata, ParamMetadataObject, ROUTER_KEY, RouterMetadataObject, SAVANT_KEY } from "./define";
import { getOriginMetadata, IOCContainer, RecursiveGetMetadata, TAGGED_PARAM } from "../container";
import { PARAM_CHECK_KEY, PARAM_RULE_KEY, PARAM_TYPE_KEY, ValidOtpions, ValidRules } from "../validation";






/**
 * controller handler
 * @param {Kirinriki} app
 * @param {IContext} ctx
 * @param {*} ctl
 * @param {*} method
 * @param {*} ctlParams
 * @returns
 */
export async function buildHandler(app: Kirinriki, ctx: IContext, ctlClass: any, method: string, ctlParams: any) {
    const ctl = IOCContainer.getInsByClass(ctlClass);

    if (!ctl) {
        throw new Exception("SYSTEM_CTL_ABSENT", "Controller not found.");
    }
    if (!ctx) {
        throw new Exception("SYSTEM_CTX_ABSENT", "Context not found.");
    }

    // call ctl.__before()
    if (ctl.__before && lodash.isFunction(ctl.__before)) {
        await ctl.__before(ctx);
    }

    // Aspect（before）
    const beforeAspects = IOCContainer.getPropertyData(ASPECT_BEFORE, ctlClass, method) || [];
    for await (const { name, exec } of beforeAspects) {
        await exec(ctx);
    }

    // fetch param
    let args = [];
    if (ctlParams) {
        args = await getParamter(app, ctx, ctlParams);
    }

    const res = await ctl[method](...args);

    // call ctl.__behind()
    if (ctl.__behind && lodash.isFunction(ctl.__behind)) {
        await ctl.__behind(ctx);
    }

    // Aspect（behind）
    const behindAspects = IOCContainer.getPropertyData(ASPECT_BEHIND, ctlClass, method) || [];
    for await (const { name, exec } of behindAspects) {
        await exec(ctx);
    }

    ctx.body = ctx.body || res;
}


/**
 *
 *
 * @param {Kirinriki} app
 * @param {*} target
 * @param {*} [instance]
 * @returns {*}
 */
export function buildRouter(app: Kirinriki, target: any, instance?: any): RouterMetadataObject {
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
 * @param {Kirinriki} app
 * @param {*} target
 * @param {*} [instance]
 * @returns {*}
 */
export function buildParams(app: Kirinriki, target: any, instance?: any): ParamMetadataObject {
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