/**
 * @Author: Hanrea
 * @Date: 2023/9/13 18:26:21
 * @LastEditors: Hanrea
 * @LastEditTime: 2023/9/23 16:29:01
 * Description:
 * Copyright: Copyright (©)}) 2023 Vecmat.com. All rights reserved.
 */

import lodash from "lodash";
import { Kirinriki } from "../core";
import { asyncEmit } from "../vendor/eve";
import { ComponentItem } from "../boot/BootLoader";
import { ComponentType, IOCContainer } from "../container";

/**
 * Indicates that an decorated method is a "Monitor".
 * Receive app global events
 * @export
 * @param {string} [identifier] event name
 * @returns {MethodDecorator}
 */
export function Monitor(name: string, confg?: object): MethodDecorator {
    return (target: any, methodName: string, descriptor: PropertyDescriptor) => {
        IOCContainer.attachPropertyData("EVENT_KEY", { name, ...confg }, target, methodName);
    };
}


/**
 * 
 */
export class MonitorManager {
    public static EmitMap: Map<string, Function[]>;

    static reg(name: string, fun: Function) {
        // 学习 LoadRouter
        if (!MonitorManager.EmitMap.has(name)) {
            MonitorManager.EmitMap.set(name, []);
        }
        // 需要考虑去重
        const map = MonitorManager.EmitMap.get(name);
        map.push(fun);
    }

    // Parse monitor
    static async init() {
        const allcls = IOCContainer.listClass();
        allcls.forEach((item: ComponentItem) => {
            const [, type, name] = item.id.match(/(\S+):(\S+)/);
            const ins = IOCContainer.get(name, <ComponentType>type);
            const keyMeta = IOCContainer.listPropertyData("EVENT_KEY", item.target);
            for (const fun in keyMeta) {
                if (lodash.isFunction(ins[fun])) {
                    this.reg(keyMeta[fun], ins[fun]);
                }
            }
        });
    }

    // Mount the monitor
    static async mount(app: Kirinriki) {
        const keys = Object.keys(this.EmitMap);
        for (const key of keys) {
            const funs = this.EmitMap.get(key);
            for await (const exec of funs) {
                if (lodash.isFunction(exec)) {
                    app.on(key, exec);
                }
            }
        }
    }
}
