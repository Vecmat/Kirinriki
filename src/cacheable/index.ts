/**
 * @ Author: Hanrea
 * @ version: 2022-03-21 13:14:21
 * @ copyright: Vecmat (c) - <hi(at)vecmat.com>
 */
import lodash from "lodash";
import { DefaultLogger as logger } from "@vecmat/printer";
import { Exception, Check, Random } from "@vecmat/vendor";
import { CacheStore, Store, StoreOptions } from "../store";
import { Application, IOCContainer } from '../container';

/**
 * 
 *
 * @interface CacheStoreInterface
 */
interface CacheStoreInterface {
    store?: CacheStore;
}

// cacheStore
const cacheStore: CacheStoreInterface = {
    store: null
};

/**
 * get instances of cacheStore
 *
 * @export
 * @param {Application} app
 * @returns {*}  {CacheStore}
 */
export async function GetCacheStore(app: Application): Promise<CacheStore> {
    if (cacheStore.store && cacheStore.store.getConnection) {
        return cacheStore.store;
    }
    const opt: StoreOptions = app.config("CacheStore", "db") ?? {};
    if (Check.isEmpty(opt)) {
        logger.Warn(`Missing CacheStore server configuration. Please write a configuration item with the key name 'CacheStore' in the db.ts file.`);
    }
    cacheStore.store = Store.getInstance(opt);
    if (!lodash.isFunction(cacheStore.store.getConnection)) {
        throw new Exception("SYSERR_CACHE_CONNECTLESS",`CacheStore connection failed. `);
    }
    return cacheStore.store;
}

/**
 * initiation CacheStore connection and client.
 *
 */
async function InitCacheStore() {
    const app = IOCContainer.getApp();
    app &&
        app.once("APP_BOOT_FINISH", async function () {
            await GetCacheStore(app);
        });
}

/**
 * Decorate this method to support caching. Redis server config from db.ts.
 * The cache method returns a value to ensure that the next time the method is executed with the same parameters,
 * the results can be obtained directly from the cache without the need to execute the method again.
 *
 * @export
 * @param {string} cacheName cache name
 * @param {number} [timeout=3600] cache timeout
 * @returns {MethodDecorator}
 */
export function CacheAble(cacheName: string, timeout = 3600): MethodDecorator {
    return (target: any, methodName: string, descriptor: PropertyDescriptor) => {
        const componentType = IOCContainer.getType(target);
        // 如何支持更多？
        if (componentType !== "MIXTURE" && componentType !== "COMPONENT") {
            throw new Exception("BOOTERR_DEMET_UNSUITED", "This decorator only used in the mixture、component class.");
        }
        let identifier = IOCContainer.getIdentifier(target);
        identifier = identifier || (target.constructor ? (target.constructor.name || "") : "");
        const { value, configurable, enumerable } = descriptor;
        descriptor = {
            configurable,
            enumerable,
            writable: true,
            async value(...props: any[]) {
                let cacheFlag = true;
                const store: CacheStore = await GetCacheStore(this.app).catch(() => {
                    cacheFlag = false;
                    logger.Error("Get cache store instance failed.");
                    return null;
                });
                if (cacheFlag) {
                    // tslint:disable-next-line: one-variable-per-declaration
                    let key = "", res;
                    if (props && props.length > 0) {
                        key = `${identifier}:${methodName}:${Random.murmur(JSON.stringify(props))}`;
                    } else {
                        key = `${identifier}:${methodName}`;
                    }

                    res = await store.hget(cacheName, key).catch((): any => null);
                    if (!Check.isEmpty(res)) {
                        return JSON.parse(res);
                    }
                    // tslint:disable-next-line: no-invalid-this
                    res = await value.apply(this, props);
                    // prevent cache penetration
                    if (Check.isEmpty(res)) {
                        res = "";
                        timeout = 60;
                    }
                    // async set store
                    store.hset(cacheName, key, JSON.stringify(res), timeout).catch((): any => null);
                    return res;
                } else {
                    // tslint:disable-next-line: no-invalid-this
                    return value.apply(this, props);
                }
            }
        };
        // bind app_ready hook event 
        InitCacheStore();
        return descriptor;
    };
}

/**
 * 
 */
export type eventTimes = "Before" | "After";

/**
 * Decorating the execution of this method will trigger a cache clear operation. Redis server config from db.ts.
 *
 * @export
 * @param {string} cacheName cacheName cache name
 * @param {eventTimes} [eventTime="Before"]
 * @returns
 */
export function CacheEvict(cacheName: string, eventTime: eventTimes = "Before") {
    return (target: any, methodName: string, descriptor: PropertyDescriptor) => {
        const componentType = IOCContainer.getType(target);
        if (componentType !== "MIXTURE" && componentType !== "COMPONENT") {
            throw new Exception("BOOTERR_DEPRO_UNSUITED", "This decorator only used in the mixture、component class.");
        }
        const identifier = IOCContainer.getIdentifier(target);
        const { value, configurable, enumerable } = descriptor;
        descriptor = {
            configurable,
            enumerable,
            writable: true,
            async value(...props: any[]) {
                let cacheFlag = true;
                const store: CacheStore = await GetCacheStore(this.app).catch(() => {
                    cacheFlag = false;
                    logger.Error("Get cache store instance failed.");
                    return null;
                });

                if (cacheFlag) {
                    if (eventTime === "Before") {
                        await store.del(cacheName).catch((): any => null);
                        // tslint:disable-next-line: no-invalid-this
                        return value.apply(this, props);
                    } else {
                        // tslint:disable-next-line: no-invalid-this
                        const res = await value.apply(this, props);
                        store.del(cacheName).catch((): any => null);
                        return res;
                    }
                } else {
                    // tslint:disable-next-line: no-invalid-this
                    return value.apply(this, props);
                }
            }
        };
        // bind app_ready hook event 
        InitCacheStore();
        return descriptor;
    };
}