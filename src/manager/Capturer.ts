/**
 * @ Author: Hanrea
 * @ version: 2022-03-21 13:14:21
 * @ copyright: Vecmat (c) - <hi(at)vecmat.com>
 */

import { Exception } from "@vecmat/vendor";
import { IOCContainer } from "../container";
import { IContext, Kirinriki } from "../core";
import { CAPTURER_KEY } from "../base/Constants";
import lodash from "lodash";
/**
 * Kirinriki system error capture 
 */

export interface ICapturer {
    (err: Error, ctx?: IContext|Kirinriki ): Promise<boolean>
}


/**
 * Indicates that an decorated class is a "capturer".
 * 
 * @export 
 * @param {string} [identifier] class name
 * @returns {ClassDecorator}
 */
export function Capturer(identifier?: string): ClassDecorator {
    return (target: any) => {
        identifier = identifier || IOCContainer.getIdentifier(target);
        IOCContainer.saveClass("CAPTURER", target, identifier);
    };
}


/**
 * Register error capture function
 * @example @Catching("*")
 * @example @Catching("Sequlize*")
 * @param name  ErrorType for matching (support '*' match any char )
 * @returns 
 */
export function Catching(name: string): MethodDecorator {
    return (target, method: string, descriptor: PropertyDescriptor) => {
        const targetType = IOCContainer.getType(target);
        // if (targetType !== "CONTROLLER" && targetType !== "CAPTURER") {
        //     throw new Exception("BOOTERR_DEPRO_UNSUITED", "Request decorator is only used in controllers class.");
        // }
        IOCContainer.savePropertyData(CAPTURER_KEY, name, target, method);
    };
}

// CaptorManager;
export class Captor {
    // static map save
    static map: Map<string, ICapturer> = new Map();
    static regs: Map<string, RegExp> = new Map();
    constructor() {}
    
    // 需要再IOCContainer.reg内处理
    static reg(name: string, fun: ICapturer) {
        // 学习 LoadRouter
        if (Captor.map.has(name)) {
            throw new Exception("BOOTERR_CAPTOR_CLASH", "Captor can't reg same error name");
        }
        if (name.indexOf("*")) {
            const reg = new RegExp(name.replaceAll("*", ".*"));
            Captor.regs.set(name, reg);
        }
        Captor.map.set(name, fun);
    }

    // 寻找错误错误处理器
    static match(name: string): ICapturer[] {
        const list: ICapturer[] = [];
        // Put all matches at the start
        if (Captor.map.has("*")) {
            list.push(Captor.map.get("*"));
        }
        if (Captor.map.has(name)) {
            list.push(Captor.map.get(name));
        } else {
            for (const key of Captor.regs.keys()) {
                // Prevent duplication
                if (key === "*") return;
                if (!~key.indexOf("*")) {
                    return;
                }

                const regex = Captor.regs.get(key);
                if (regex.test(name)) {
                    list.push(Captor.map.get(key));
                }
            }
        }

        return list;
    }

    // parse

    // Mount the Captor
    static async mount(app: Kirinriki) {
        // 读取并注册到map里即可
        
    }
}
