/**
 * @ Author: Hanrea
 * @ version: 2022-03-21 13:14:21
 * @ abstract: 小组件
 * @ copyright: Vecmat (c) - <hi(at)vecmat.com>
 */
import lodash from "lodash";
import { ApiOutput } from "./Component";
import { Exception, Check } from "@vecmat/vendor";

const ARGUMENT_NAMES = /([^\s,]+)/g;
const STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;

/**
 *
 *
 * @export
 * @param {string} p
 * @returns
 */
export function requireDefault(p: string) {
    /* eslint-disable global-require */
    const ex = require(p);
    return (ex && (typeof ex === "object") && "default" in ex) ? ex.default : ex;
}

/**
 *
 *
 * @export
 * @param {string} name
 * @param {string} [controllerSuffix=""]
 * @returns
 */
let controllerReg: any = null;
export function ControllerMatch(name: string, controllerSuffix = "") {
    if (!controllerReg)
        controllerReg = new RegExp(`([a-zA-Z0-9_]+)${controllerSuffix}`);

    const result = name.split(".")[0].match(controllerReg);
    return result;
}

/**
 * get parameter name from function
 * @param func
 */
export function getParamNames(func: { toString: () => { replace: (arg0: RegExp, arg1: string) => any } }) {
    const fnStr = func.toString().replace(STRIP_COMMENTS, "");
    let result = fnStr.slice(fnStr.indexOf("(") + 1, fnStr.indexOf(")")).match(ARGUMENT_NAMES);
    if (result === null)
        result = [];

    return result;
}

/**
 * Check class file
 * name should be always the same as class name
 * class must be unique
 *
 * @export
 * @param {string} fileName
 * @param {string} xpath
 * @param {*} target
 * @param {Set<unknown>} [exSet]
 * @returns {*}
 */
export function checkClass(fileName: string, xpath: string, target: any, exSet?: Set<unknown>) {
    if (!exSet) return;
    // *  同一类型下不要有相同类名就可以了
    let calssname = "";
    if(target.__esModule && target.name === undefined ){
        const keys = Object.keys(target);
        if(Check.isClass(target[keys[0]])){
            calssname  = keys[0];
        }
    }
    calssname = calssname || target.name || fileName;
    if(!calssname){
        throw new Exception("BOOTERR_LOADER_CHECK",`The file(${xpath}) export error name.`);
    }

    if (exSet.has(calssname))
        throw new Exception("BOOTERR_LOADER_CHECK",`A same class (${calssname}) already exists. at \`${xpath}\`.`);
    exSet.add(calssname);
}

/**
 * Format api interface data format
 *
 * @private
 * @param {Error | string | ApiInput} msg   待处理的接口数据信息｜接口msg
 * @param {*} data    待返回的数据
 * @param {number} defaultCode   默认错误码
 * @returns {ApiOutput}   格式化之后的接口数据
 * @memberof BaseController
 */
export function formatApiData(msg: any, data: any, defaultCode: number): ApiOutput {
    let obj: ApiOutput = {
        code: defaultCode,
        message: "",
        data: null,
    };
    if (lodash.isError(msg)) {
        const { code, message, } = <any>msg;
        obj.code = code || defaultCode;
        obj.message = message;
    } else if (lodash.isObject(msg)) {
        obj = { ...obj, ...msg, };
    } else {
        obj.message = msg;
        obj.data = data;
    }
    return obj;
}
