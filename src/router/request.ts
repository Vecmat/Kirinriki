/**
 * @ Author: Hanrea
 * @ version: 2022-03-21 13:14:21
 * @ copyright: Vecmat (c) - <hi(at)vecmat.com>
 */
import lodash from "lodash";
import { IContext } from "../core";
import { Exception } from "@vecmat/vendor";
import { paramterTypes } from "../validation"; 
import { IOCContainer, TAGGED_PARAM } from "../container";



/**
 * Inject ParameterDecorator
 * @param {Function} fn
 * @param {string} name
 * @returns {*}  {ParameterDecorator}
 */
export const InjectParams = (fn: Function, name: string): ParameterDecorator => {
    return (target: Object, propertyKey: string, descriptor: number) => {
        const targetType = IOCContainer.getType(target);
        if (targetType !== "CONTROLLER") {
            throw new Exception("BOOTERR_DEMET_UNSUITED", `${name} decorator is only used in controllers class.`);
        }
        // 获取成员类型
        debugger;
        // todo 可用用来打印参数获取
        const ctype = Reflect.getMetadata("design:type", target, propertyKey);
        // 获取成员参数类型
        const paramTypes = Reflect.getMetadata("design:paramtypes", target, propertyKey);
        // 获取成员返回类型
        const returnType = Reflect.getMetadata("design:returntype", target, propertyKey);
        // 获取所有元数据 key (由 TypeScript 注入)
        const keys = Reflect.getMetadataKeys(target, propertyKey);
        let type = paramTypes[descriptor]?.name ? paramTypes[descriptor].name : "object";
        let isDto = false;
        //DTO class
        if (!(lodash.toString(type) in paramterTypes)) {
            type = IOCContainer.getIdentifier(paramTypes[descriptor]);
            // reg to IOC container
            // IOCContainer.reg(type, paramTypes[descriptor]);
            isDto = true;
        }

        IOCContainer.attachPropertyData(
            TAGGED_PARAM,
            {
                name: propertyKey,
                fn,
                index: descriptor,
                type,
                isDto
            },
            target,
            propertyKey
        );
        return descriptor;
    };
};



/**
 * Get context.
 *
 * @export
 * @param {string} [name]
 * @returns
 */
export function Ctx(): ParameterDecorator {
    return InjectParams((ctx: IContext) => {
        return ctx;
    }, "CTX");
}


/**
 * Get mixture for ctx.
 */
export function Mix(name: string): ParameterDecorator {
    return InjectParams((ctx: IContext) => {
        return ctx.getMixture(name);
    }, "Act");
}


/**
 * Get request header.
 *
 * @export
 * @param {string} [name]
 * @returns
 */
export function Header(name?: string): ParameterDecorator {
    return InjectParams((ctx: IContext) => {
        if (name !== undefined) {
            return ctx.get(name);
        }
        return ctx.headers;
    }, "Header");
}

/**
 * Get path variable (take value from ctx.params).
 *
 * @export
 * @param {string} [name] params name
 * @returns
 */
export function Path(name?: string): ParameterDecorator {
    return InjectParams((ctx: IContext) => {
        const pathParams: any = ctx.params ?? {};
        if (name === undefined) {
            return pathParams;
        }
        return pathParams[name];
    }, "Path");
}

/**
 * Get query-string parameters (take value from ctx.query).
 *
 * @export
 * @param {string} [name]
 * @returns
 */
export function Query(name?: string): ParameterDecorator {
    return InjectParams((ctx: IContext) => {
        const queryParams: any = ctx.query ?? {};
        if (name === undefined) {
            return queryParams;
        }
        return queryParams[name];
    }, "Query");
}

/**
 * Get parsed upload file object.
 *
 * @export
 * @param {string} [name]
 * @returns
 */
export function File(name?: string): ParameterDecorator {
    return InjectParams((ctx: IContext) => {
        return ctx.bodyParser().then((body: { file: Object }) => {
            const params: any = body.file ?? {};
            if (name === undefined) {
                return params;
            }
            return params[name];
        });
    }, "File");
}

/**
 * Get parsed POST/PUT... body.
 *
 * @export
 * @param {string} [name]
 * @returns
 */
export function Body(name?: string): ParameterDecorator {
    return InjectParams((ctx: IContext) => {
        return ctx.bodyParser().then((body: { post: Object }) => {
            const params: any = body.post ? body.post : body;
            if (name === undefined) {
                return params;
            }
            return params[name];
        });
    }, "Body");
}






/**
 * Get POST/GET parameters, POST priority
 *
 * @export
 * @param {string} [name]
 * @returns {ParameterDecorator}
 */
export function Param(name?: string): ParameterDecorator {
    return InjectParams((ctx: IContext) => {
        return ctx.bodyParser().then((body: { post: Object }) => {
            const queryParams: any = ctx.queryParser() ?? {};
            const postParams: any = (body.post ? body.post : body) ?? {};
            if (name !== undefined) {
                return postParams[name] === undefined ? queryParams[name] : postParams[name];
            }
            return { ...queryParams, ...postParams };
        });
    }, "Param");
}

