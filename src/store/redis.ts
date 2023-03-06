/**
 * @ Author: Hanrea
 * @ version: 2022-03-21 13:14:21
 * @ copyright: Vecmat (c) - <hi(at)vecmat.com>
 */
import IORedis from "ioredis";
import genericPool from "generic-pool";
import { Helper } from "@vecmat/vendor";
import { StoreOptions } from "./options";
import { CacheStore } from "./store";
import { DefaultLogger as logger } from "@vecmat/printer";

/**
 *
 *
 * @export
 * @class RedisStore
 */
export class RedisStore extends CacheStore {
    declare options: StoreOptions;
    declare pool: genericPool.Pool<IORedis.Redis | IORedis.Cluster>;
    declare public client: IORedis.Redis | IORedis.Cluster;

    /**
     * Creates an instance of RedisStore.
     * @param {StoreOptions} options
     * @memberof RedisStore
     */
    constructor(options: StoreOptions) {
        super(options);
        this.options = this.parseOpt(options);
        this.pool = null;
        this.client = null;
    }

    // parseOpt
    private parseOpt(options: StoreOptions) {
        const opt: StoreOptions = {
            host: options.host || '127.0.0.1',
            port: options.port || 3306,
            username: options.username || "",
            password: options.password || "",
            db: options.db || 0,
            timeout: options.timeout,
            keyPrefix: options.keyPrefix || '',
            poolSize: options.poolSize || 10,
            connectTimeout: options.connectTimeout || 500,
        };

        if (Helper.isArray(options.host)) {
            const hosts: Array<{ host: string; port: number }> = [];
            for (let i = 0; i < options.host.length; i++) {
                const h = options.host[i];
                if (!Helper.isEmpty(options.host[i])) {
                    let p: number;
                    if (Array.isArray(options.port)) {
                        p = options.port[i];
                    } else {
                        p = options.port || 6379;
                    }
                    hosts.push({
                        host: h,
                        port: Helper.toNumber(p),
                    });
                }
            }
            // sentinel
            if (!Helper.isEmpty(options.name)) {
                opt.host = "";
                opt.port = null;
                opt.sentinels = [...hosts];
                opt.sentinelUsername = options.username;
                opt.sentinelPassword = options.password;
            } else {
                // cluster
                opt.host = "";
                opt.port = null;
                opt.clusters = [...hosts];
            }
        }
        return opt;
    }

    /**
     * create connection by native
     *
     * @param {number} [connNum=0]
     * @returns {*}  {Promise<IORedis.Redis | IORedis.Cluster>}
     * @memberof RedisStore
     */
    private async connect(connNum = 0): Promise<IORedis.Redis | IORedis.Cluster> {
        if (this.client && this.client.status === 'ready') {
            return this.client;
        }

        const defer = Helper.getDefer();
        let connection: IORedis.Redis | IORedis.Cluster;
        if (!Helper.isEmpty(this.options.clusters)) {
            connection = new IORedis.Cluster([...this.options.clusters], { redisOptions: <{ host: string }>this.options });
        } else {
            connection = new IORedis(<{ host: string }>this.options);
        }
        connection.on('end', () => {
            if (connNum < 3) {
                connNum++;
                defer.resolve(this.connect(connNum));
            } else {
                this.close();
                defer.reject('redis connection end');
            }
        });
        connection.on('ready', () => {
            this.client = connection;
            defer.resolve(connection);
        });

        return defer.promise;
    }

    /**
     * get connection from pool
     *
     * @returns {*}  
     * @memberof RedisStore
     */
    getConnection() {
        if (!this.pool || !this.pool.acquire) {
            const factory = {
                create: () => {
                    return this.connect();
                },
                destroy: () => {
                    return this.close();
                },
                validate: (resource: IORedis.Redis | IORedis.Cluster) => {
                    return Promise.resolve(resource.status === 'ready');
                }
            };
            this.pool = genericPool.createPool(factory, {
                max: this.options.poolSize || 10, // maximum size of the pool
                min: 2 // minimum size of the pool
            });
            this.pool.on('factoryCreateError', function (err:Error) {
                logger.Error(err);
            });
            this.pool.on('factoryDestroyError', function (err:Error) {
                logger.Error(err);
            });
        }

        return this.pool.acquire();
    }

    /**
     * close connection
     *
     * @returns {*}  
     * @memberof RedisStore
     */
    async close() {
        this.client.disconnect();
        this.client = null;
        this.pool.destroy(this.client);
        this.pool = null;
        return;
    }

    /**
     *
     *
     * @param {*} conn
     * @returns {*}  
     * @memberof RedisStore
     */
    async release(conn: any) {
        if (this.pool.isBorrowedResource(conn)) {
            return this.pool.release(conn);
        }
        return Promise.resolve();
    }

    /**
     * defineCommand
     *
     * @param {string} name
     * @param {{ numberOfKeys?: number; lua?: string; }} scripts
     * @returns {*}  
     * @memberof RedisStore
     */
    async defineCommand(name: string, scripts: { numberOfKeys?: number; lua?: string; }) {
        const conn: any = await this.getConnection();
        if (!conn[name]) {
            conn.defineCommand(name, scripts);
        }

        return conn;
    }

    /**
     * get and compare value
     *
     * @param {string} name
     * @param {(string | number)} value
     * @returns {*}  {Promise<any>}
     * @memberof RedisStore
     */
    async getCompare(name: string, value: string | number): Promise<any> {
        let conn: any;
        try {
            conn = await this.defineCommand("getCompare", {
                numberOfKeys: 1,
                lua: `
                    local remote_value = redis.call("get",KEYS[1])
                    
                    if (not remote_value) then
                        return 0
                    elseif (remote_value == ARGV[1]) then
                        return redis.call("del",KEYS[1])
                    else
                        return -1
                    end
            `});
            return conn.getCompare(name, value);
        } catch (error) {
            throw error;
        } finally {
            this.release(conn);
        }
    }
}