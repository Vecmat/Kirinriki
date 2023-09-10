import lodash from "lodash";
import EventEmitter from "events";

/**
 * Execute event as async
 *
 * @param {Kirinriki} eve
 * @param {string} eventName
 */
export const asyncEvent = async function (eve: EventEmitter, eventName: string ,args:any[]=[]) {
    const list: any[] = eve.listeners(eventName);
    for await (const func of list) {
        if (lodash.isFunction(func)) {
            func(...args);
        }
    }
    // 移除监听？为何？
    // eve.removeAllListeners(eventName);
    return; 
};
