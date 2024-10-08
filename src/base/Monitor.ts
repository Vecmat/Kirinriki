/**
 * @Author: Hanrea
 * @Date: 2023/9/13 18:26:21
 * @LastEditors: Hanrea
 * @LastEditTime: 2023/9/23 16:29:01
 * Description:
 * Copyright: Copyright (©)}) 2023 Vecmat.com. All rights reserved.
 */

import lodash from "lodash";
import { Check } from "@vecmat/vendor";
import { Kirinriki } from "../core/Application.js";
import { ComponentItem } from "../boot/BootLoader.js";
import { IOCContainer } from "../container/Container.js";
import { ComponentType } from "../container/IContainer.js";

/**
 * Indicates that an decorated method is a "Monitor".
 * Receive app global events
 * @export
 * @param {string} [identifier] event name
 * @returns {MethodDecorator}
 */
export function Monitor(name: string, confg?: object): MethodDecorator {
    return (target: Object, method: string | symbol, descriptor: PropertyDescriptor) => {
        IOCContainer.attachPropertyData("EVENT_KEY", { name, ...confg }, target, method);
    };
}


/**
 *
 */
export class MonitorManager {
    public static EmitMap: Map<string, Function[]> = new Map();

    static reg(name: string, fun: Function) {
        // 学习 LoadRouter
        if (!MonitorManager.EmitMap.has(name)) {
            MonitorManager.EmitMap.set(name, []);
        }
        // 需要考虑去重
        const map = MonitorManager.EmitMap.get(name);
        if(map){
          map.push(fun);
        }
    }

    // Parse monitor
    static async init(app:Kirinriki) {
        const allcls = IOCContainer.listClass();
        allcls.forEach((item: ComponentItem) => {
            const [, type, name] = item.id.match(/(\S+):(\S+)/)||[];
            if (!name || !type) {
                console.error(`[Kirinriki] Component :"${item.id}"‘s name format error!`);
                return;
            }
            const ins = IOCContainer.get(name, <ComponentType>type);
            const keyMeta = IOCContainer.listPropertyData("EVENT_KEY", item.target);
            for (const fun in keyMeta) {
                const name = keyMeta[fun]["name"];
                if (lodash.isFunction(ins[fun])) {
                    this.reg( name,ins[fun] );
                }
            }
        });
    }

    // Mount the monitor
    static async mount(app: Kirinriki) {
        const keys = Object.keys(MonitorManager.EmitMap);
        for (const key of keys) {
            const funs = MonitorManager.EmitMap.get(key) ||[];
            for await (const exec of funs) {
                if (lodash.isFunction(exec)) {
                    app.on(key, exec);
                }
            }
        }
    }
}
