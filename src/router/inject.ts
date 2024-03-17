import lodash from "lodash";
import { Exception } from "@vecmat/vendor";
import { TAGGED_PARAM } from "../container/IContainer.js";
import { IOCContainer } from "../container/index.js";
import { paramterTypes } from "../validation/rule.js";
import { RequestMethod, ROUTER_KEY, RouterOption, TParams, TSavant, ASPECT_SAVANT, TAspect, ASPECT_BEFORE, ASPECT_BEHIND } from "./define.js";


/**
 * Routes HTTP requests to the specified path.
 *
 * @param {string} [path="/"]
 * @param {RequestMethod} [reqMethod=RequestMethod.GET]
 * @param {{
 *         routerName?: string;
 *     }} [routerOptions={}]
 * @returns {*}  {MethodDecorator}
 */
export const InjectRouter = (
    path = "/",
    reqMethod: RequestMethod = RequestMethod.GET,
    routerOptions: {
        routerName?: string
    } = {}
): MethodDecorator => {
    const routerName = routerOptions.routerName ?? "";
    return (target: Object, method: string | symbol, descriptor: PropertyDescriptor) => {
        const targetType = IOCContainer.getType(target);
        if (targetType !== "CONTROLLER") {
            throw new Exception("BOOTERR_DEPRO_UNSUITED", "Request decorator is only used in controllers class.");
        }
        // tslint:disable-next-line: no-object-literal-type-assertion
        IOCContainer.attachPropertyData(
            ROUTER_KEY,
            {
                path,
                requestMethod: reqMethod,
                routerName,
                method: method
            } as RouterOption,
            target,
            method
        );

        return descriptor;
    };
};




/**
 * Inject ParameterDecorator
 * @param {Function} fn
 * @param {string} name
 * @returns {*}  {ParameterDecorator}
 */
export const InjectParams = (name: string, fn: TParams): ParameterDecorator => {
    return (target: Object, propertyKey: string | symbol | undefined ="", descriptor: number) => {
        const targetType = IOCContainer.getType(target);
        if (targetType !== "CONTROLLER") {
            throw new Exception("BOOTERR_DEMET_UNSUITED", `${name} decorator is only used in controllers class.`);
        }
        // const ctype = Reflect.getMetadata("design:type", target, propertyKey);
        const paramTypes = Reflect.getMetadata("design:paramtypes", target, propertyKey);
        // const returnType = Reflect.getMetadata("design:returntype", target, propertyKey);
        // const keys = Reflect.getMetadataKeys(target, propertyKey);

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
 * Inject Savant
 * @param {string} name
 * @param {Function} exec
 * @returns
 */
export function InjectSavant(name: string, exec: TSavant): MethodDecorator {
    return (target: Object, method: string | symbol, descriptor: PropertyDescriptor) => {
        IOCContainer.attachPropertyData(ASPECT_SAVANT, exec, target, method);
    };
}

export type EAspect = "BEFORE" | "BEHIND";

/**
 * Inject Aspect
 * @param {EAspect} type
 * @param {Function} exec
 * @returns
 */
export function InjectAspect(type: EAspect, exec: TAspect): MethodDecorator {
    return (target: Object, method: string | symbol, descriptor: PropertyDescriptor) => {
        if (type == "BEFORE") {
            IOCContainer.attachPropertyData(ASPECT_BEFORE, { type, exec }, target, method);
        }
        if (type == "BEHIND") {
            IOCContainer.attachPropertyData(ASPECT_BEHIND, { type, exec }, target, method);
        }
    };
}
