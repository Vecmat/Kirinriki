/**
 * @ Author: Hanrea
 * @ version: 2022-03-21 13:14:21
 * @ copyright: Vecmat (c) - <hi(at)vecmat.com>
 */
import { CacheStore } from ".";
import { StoreOptions } from "./options";
import { Exception } from "@vecmat/vendor";
import { MemoryCache, messages } from "./Cache";

export class MemoryStore extends CacheStore {
    declare client: any;
    declare pool: any;
    declare options: StoreOptions;

    /**
     * Creates an instance of MemoryStore.
     * @param {StoreOptions} options
     * @memberof MemoryStore
     */
    constructor(options: StoreOptions) {
        super(options);
        this.options = options;
        this.client = null;
    }

    /**
     * getConnection
     *
     * @returns {*}
     * @memberof MemoryStore
     */
    getConnection(): MemoryCache {
        if (!this.pool) {
            this.pool = new MemoryCache({
                database: this.options.db
            });
        }
        if (!this.client) {
            this.client = this.pool.createClient();
            this.client.status = "ready";
        }

        return this.client;
    }

    /**
     * close
     *
     * @returns {*}  {Promise<void>}
     * @memberof MemoryStore
     */
    async close(): Promise<void> {
        this.client.end();
        this.client = null;
    }
    /**
     * release
     *
     * @param {*} conn
     * @returns {*}  {Promise<void>}
     * @memberof MemoryStore
     */
    async release(conn: any): Promise<void> {
        return;
    }

    /**
     * defineCommand
     *
     * @param {string} name
     * @param {*} scripts
     * @memberof MemoryStore
     */
    async defineCommand(name: string, scripts: any) {
        throw new Exception("SYSERR_CACHE_UNSUPPORTED", messages.unsupported);
    }

    /**
     * get and compare value
     *
     * @param {string} name
     * @param {(string | number)} value
     * @returns {*}  {Promise<any>}
     * @memberof MemoryStore
     */
    async getCompare(name: string, value: string | number): Promise<any> {
        const client = this.getConnection();
        const val = client.get(`${this.options.keyPrefix}${name}`);
        if (!val) {
            return 0;
        } else if (val == value) {
            return client.del(`${this.options.keyPrefix}${name}`);
        } else {
            return -1;
        }
    }
}
