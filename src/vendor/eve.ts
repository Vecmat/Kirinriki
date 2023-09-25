
import lodash from "lodash";
import EventEmitter from "events";
import { IOCContainer } from "../container";

/**
 * Execute event as async
 *
 * @param {Kirinriki} eve
 * @param {string} eventName
 */
export const asyncEmit = async function (eve: EventEmitter, eventName: string ,args:any[]=[]) {
    const list: any[] = eve.listeners(eventName);
    for await (const func of list) {
        if (lodash.isFunction(func)) {
            func(...args);
        }
    }
    // why?
    // eve.removeAllListeners(eventName);
    return; 
};


