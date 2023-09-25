/**
 * @Author: Hanrea
 * @Date: 2023/9/13 18:26:21
 * @LastEditors: Hanrea
 * @LastEditTime: 2023/9/13 18:26:21
 * Description:
 * Copyright: Copyright (©)}) 2023 Vecmat.com. All rights reserved.
 */

import lodash from "lodash";
import { Logger } from "../base/Logger";
import { Trace } from "../trace";
import { asyncEmit } from "../vendor/eve";
import { Kirinriki } from "../core";
import { Payload } from "../payload";
import { Exception } from "@vecmat/vendor";
import { ComponentItem } from "../boot/BootLoader";
import { SAVANT_KEY } from "../router/define";
import { ComponentType, IOCContainer } from "../container";

/**
 * Indicates that an decorated method is a "savant".
 *
 * @export
 * @param {string} [identifier] savant name
 * @returns {MethodDecorator}
 */
export  function Savant(name: string, confg?: object): MethodDecorator {
    return (target: any, methodName: string, descriptor: PropertyDescriptor) => {
        // 存到专用数组里？
        IOCContainer.attachPropertyData(SAVANT_KEY, { name, ...confg }, target, methodName);
    };
}


export class SavantManager {
    public static queues: string[] = [];
    public static map: Map<string, any> = new Map();

    constructor() {}

    static reg(name: string, fun: Function) {
        // 学习 LoadRouter
        if (SavantManager.map.has(name)) {
            throw new Exception("BOOTERR_SAVNT_CLASH", "Savant can't reg same savant name");
        }
        SavantManager.map.set(name, fun);
    }

    // init savant function
    static async init() {
        // Built in savant
        this.reg("Trace", Trace);
        this.reg("Playload", Payload);
        // Custom savant
        const allcls = IOCContainer.listClass();
        allcls.forEach((item: ComponentItem) => {
            const [, type, name] = item.id.match(/(\S+):(\S+)/);
            const ins = IOCContainer.get(name, <ComponentType>type);
            const keyMeta = IOCContainer.listPropertyData(SAVANT_KEY, item.target);
            for (const fun in keyMeta) {
                if (lodash.isFunction(ins[fun])) {
                    this.reg(keyMeta[fun], ins[fun]);
                }
            }
        });
    }

    // Mount the savant
    static async mount(app: Kirinriki) {
        // get Savant config
        let savantConf = app.config(undefined, "savant");
        const sysQueue = ["Trace", "Payload"];
        //
        if (lodash.isEmpty(savantConf)) {
            savantConf = { config: {}, queue: [] };
        }
        //
        const queueSet = new Set(sysQueue);
        const configQueue = savantConf.queue;
        configQueue.forEach((name: string) => {
            if (!sysQueue.includes(name)) {
                queueSet.add(name);
            }
        });
        SavantManager.queues = Array.from(queueSet);

        
        await asyncEmit(app, "LOAD_APP_SAVANT_BEFORE", [SavantManager.queues]);

        // $ Need check ？
        // Automatically call savant
        for (const key of SavantManager.queues) {
            const handle: any = SavantManager.map.get(key);
            if (!handle) {
                Logger.Error(`Savant ${key} load error.`);
                continue;
            }
            if (!lodash.isFunction(handle)) {
                Logger.Error(`Savant ${key} must be implements method 'run'.`);
                continue;
            }
            if (savantConf.config[key] === false) {
                // Default savant cannot be disabled
                if (sysQueue.includes(key)) {
                    Logger.Warn(`Savant ${key} cannot be disabled.`);
                } else {
                    Logger.Warn(`Savant ${key} already loaded but not effective.`);
                    continue;
                }
            }
            Logger.Debug(`Load savant: ${key}`);
            const result = await handle(savantConf.config[key] || {}, app);
            if (lodash.isFunction(result)) {
                app.use(result);
            }
        }
    }
}

