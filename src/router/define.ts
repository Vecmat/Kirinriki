import lodash from "lodash";
import { IContext, INext } from "../core";
import { Exception } from "@vecmat/vendor";
import { ValidOtpions, ValidRules, paramterTypes } from "../validation";
import { IOCContainer, TAGGED_PARAM } from "../container";


export const SAVANT_KEY = Symbol("SAVANT_KEY");
export const ROUTER_KEY = Symbol("ROUTER_KEY");

export const ASPECT_BEFORE = Symbol("ASPECT_BEFORE");
export const ASPECT_BEHIND = Symbol("ASPECT_BEHIND");

export const CONTROLLER_ROUTER = Symbol("CONTROLLER_ROUTER");

export type TAspect = (context: IContext) => Promise<void>;
export type TParams = (context: IContext) => Promise<any> | any;
export type TSavant = (context: IContext, next: INext) => Promise<void>;


/**
 * RouterOptions
 *
 * @export
 * @interface RouterOptions
 */
export interface RouterOptions {
    prefix: string
    /**
     * Methods which should be supported by the router.
     */
    methods?: string[]
    routerPath?: string
    /**
     * Whether or not routing should be case-sensitive.
     */
    sensitive?: boolean
    /**
     * Whether or not routes should matched strictly.
     *
     * If strict matching is enabled, the trailing slash is taken into
     * account when matching routes.
     */
    strict?: boolean
    /**
     * gRPC protocol file
     */
    protoFile?: string
    // 
    /**
     * Other extended configuration
     */
    ext?: any
}

/**
 * Kirinriki router options
 *
 * @export
 * @interface RouterOption
 */
export interface RouterOption {
    path?: string;
    requestMethod: string;
    routerName?: string;
    method: string;
}

/**
 * http request methods
 *
 * @export
 * @var RequestMethod
 */
export enum RequestMethod {
    "GET" = "get",
    "POST" = "post",
    "PUT" = "put",
    "DELETE" = "delete",
    "PATCH" = "patch",
    "ALL" = "all",
    "OPTIONS" = "options",
    "HEAD" = "head"
}

/**
 *
 *
 * @interface RouterMetadata
 */
export interface RouterMetadata {
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
export interface RouterMetadataObject {
    [key: string]: RouterMetadata;
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
 * @interface ParamOptions
 */
export interface ParamOptions {
    index: number;
    isDto: boolean;
    type: string;
    validRule: Function | ValidRules | ValidRules[];
    validOpt: ValidOtpions;
    dtoCheck: boolean;
    dtoRule: any;
    clazz: any;
}
