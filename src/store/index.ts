/**
 * @ Author: Hanrea
 * @ version: 2022-03-21 13:14:21
 * @ copyright: Vecmat (c) - <hi(at)vecmat.com>
 */
import { CacheStore } from "./store";
export { CacheStore } from "./store";
import { MemoryStore } from "./memory";
import { RedisStore } from "./redis";
import { StoreOptions } from "./options";
// export
export { MemoryStore } from "./memory";

export { StoreOptions } from "./options";
/**
 *
 *
 * @export
 * @class Store
 */
export class Store {
    private static instance: CacheStore;

    /**
     * 
     *
     * @static
     * @returns
     * @memberof ValidateUtil
     */
    static getInstance(options: StoreOptions): CacheStore {
        if (this.instance) {
            return this.instance;
        }
        options = {
            ...{
                type: 'memory', // memory | redis
                host: '',
                port: 0,
                keyPrefix: 'KRNRK',
                timeout: 600,
                poolSize: 10,
                connectTimeout: 500,
                db: 0
            }, ...options
        };
        switch (options.type) {
            case "redis":
                this.instance = new RedisStore(options);
                break;
            case "memory":
            default:
                this.instance = new MemoryStore(options);
                break;
        }

        return this.instance;
    }
}