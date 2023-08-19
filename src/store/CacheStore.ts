/**
 * @ Author: Hanrea
 * @ version: 2022-03-21 13:14:21
 * @ copyright: Vecmat (c) - <hi(at)vecmat.com>
 */
import { Exception } from "@vecmat/vendor";
import { StoreOptions } from "./options";

/**
 *
 *
 * @export
 * @class Store
 */
export class CacheStore {
    client: any;
    pool: any;
    options: StoreOptions;

    /**
     * Creates an instance of CacheStore.
     * @param {StoreOptions} options
     * @memberof CacheStore
     */
    constructor(options: StoreOptions) {
        this.options = options;
        this.pool = null;
        this.client = null;
    }

    getConnection() {
        throw new Exception("SYSERR_CACHE_UNSUPPORTED", "Method not implemented.");
    }
    close(): Promise<void> {
        throw new Exception("SYSERR_CACHE_UNSUPPORTED", "Method not implemented.");
    }
    release(conn: any): Promise<void> {
        throw new Exception("SYSERR_CACHE_UNSUPPORTED", "Method not implemented.");
    }
    defineCommand(name: string, scripts: any) {
        throw new Exception("SYSERR_CACHE_UNSUPPORTED", "Method not implemented.");
    }
    getCompare(name: string, value: string | number): Promise<any> {
        throw new Exception("SYSERR_CACHE_UNSUPPORTED", "Method not implemented.");
    }

    /**
     * handler for native client
     *
     * @param {string} name
     * @param {any[]} data
     * @returns {*}
     * @memberof RedisStore
     */
    protected async wrap(name: string, data: any[]) {
        let conn: any;
        try {
            conn = await this.getConnection();
            const res = await conn[name](...data);
            return res;
        } catch (err) {
            throw err;
        } finally {
            this.release(conn);
        }
    }

    /**
     * 字符串获取
     * @param name
     */
    get(name: string) {
        return this.wrap("get", [`${this.options.keyPrefix}${name}`]);
    }

    /**
     * 字符串写入
     * @param name
     * @param value
     * @param timeout
     * @returns {Promise}
     */
    set(name: string, value: string | number, timeout?: number) {
        if (typeof timeout !== "number") {
            timeout = this.options.timeout;
        }
        return this.wrap("set", [`${this.options.keyPrefix}${name}`, value, "ex", timeout]);
    }

    /**
     * 以秒为单位，返回给定 key 的剩余生存时间
     * @param name
     * @returns {*}
     */
    ttl(name: string) {
        return this.wrap("ttl", [`${this.options.keyPrefix}${name}`]);
    }

    /**
     * 设置key超时属性
     * @param name
     * @param timeout
     */
    expire(name: string, timeout?: number) {
        return this.wrap("expire", [`${this.options.keyPrefix}${name}`, timeout]);
    }

    /**
     * 删除key
     * @param name
     */
    rm(name: string) {
        return this.wrap("del", [`${this.options.keyPrefix}${name}`]);
    }

    /**
     *
     *
     * @param {*} name
     * @returns
     */
    del(name: string) {
        return this.wrap("del", [`${this.options.keyPrefix}${name}`]);
    }

    /**
     * 判断key是否存在
     * @param name
     */
    exists(name: string) {
        return this.wrap("exists", [`${this.options.keyPrefix}${name}`]);
    }

    /**
     * 自增
     * @param name
     */
    incr(name: string) {
        return this.wrap("incr", [`${this.options.keyPrefix}${name}`]);
    }

    /**
     * 自减
     * @param name
     * @returns {*}
     */
    decr(name: string) {
        return this.wrap("decr", [`${this.options.keyPrefix}${name}`]);
    }

    /**
     * 将 key 所储存的值增加增量
     * @param name
     * @param incr
     * @returns {*}
     */
    incrby(name: string, incr = 1) {
        return this.wrap("incrby", [`${this.options.keyPrefix}${name}`, incr]);
    }

    /**
     * 将 key 所储存的值减去减量
     *
     * @param {any} name
     * @param {any} decr
     */
    decrby(name: string, decr = 1) {
        return this.wrap("decrby", [`${this.options.keyPrefix}${name}`, decr]);
    }

    /**
     * 哈希写入
     * @param name
     * @param key
     * @param value
     * @param timeout
     */
    hset(name: string, key: string, value: string | number, timeout?: number) {
        const setP = [this.wrap("hset", [`${this.options.keyPrefix}${name}`, key, value])];
        if (typeof timeout !== "number") {
            timeout = this.options.timeout;
        }
        setP.push(this.set(`${name}:${key}_ex`, 1, timeout));
        return Promise.all(setP);
    }

    /**
     * 哈希获取
     * @param name
     * @param key
     * @returns {*}
     */
    hget(name: string, key: string) {
        const setP = [this.get(`${name}:${key}_ex`)];
        setP.push(this.wrap("hget", [`${this.options.keyPrefix}${name}`, key]));
        return Promise.all(setP).then(dataArr => {
            if (dataArr[0] === null) {
                this.hdel(name, key);
                return null;
            }
            return dataArr[1] || null;
        });
    }

    /**
     * 查看哈希表 hashKey 中，给定域 key 是否存在
     * @param name
     * @param key
     * @returns {*}
     */
    hexists(name: string, key: string) {
        const setP = [this.get(`${name}:${key}_ex`)];
        setP.push(this.wrap("hexists", [`${this.options.keyPrefix}${name}`, key]));
        return Promise.all(setP).then(dataArr => {
            if (dataArr[0] === null) {
                this.hdel(name, key);
                return 0;
            }
            return dataArr[1] || 0;
        });
    }

    /**
     * 哈希删除
     * @param name
     * @param key
     * @returns {*}
     */
    hdel(name: string, key: string) {
        const setP = [this.del(`${name}:${key}_ex`)];
        setP.push(this.wrap("hdel", [`${this.options.keyPrefix}${name}`, key]));
        return Promise.all(setP);
    }

    /**
     * 返回哈希表 key 中域的数量
     * @param name
     * @returns {*}
     */
    hlen(name: string) {
        return this.wrap("hlen", [`${this.options.keyPrefix}${name}`]);
    }

    /**
     * 给哈希表指定key，增加increment
     * @param name
     * @param key
     * @param incr
     * @returns {*}
     */
    hincrby(name: string, key: string, incr = 1) {
        return this.wrap("hincrby", [`${this.options.keyPrefix}${name}`, key, incr]);
    }

    /**
     * 返回哈希表所有key-value
     * @param name
     * @returns {*}
     */
    hgetall(name: string) {
        return this.wrap("hgetall", [`${this.options.keyPrefix}${name}`]);
    }

    /**
     * 返回哈希表所有key
     * @param name
     * @returns {*}
     */
    hkeys(name: string) {
        return this.wrap("hkeys", [`${this.options.keyPrefix}${name}`]);
    }

    /**
     * 返回哈希表所有value
     * @param name
     * @returns {*}
     */
    hvals(name: string) {
        return this.wrap("hvals", [`${this.options.keyPrefix}${name}`]);
    }

    /**
     * 判断列表长度，若不存在则表示为空
     * @param name
     * @returns {*}
     */
    llen(name: string) {
        return this.wrap("llen", [`${this.options.keyPrefix}${name}`]);
    }

    /**
     * 将值插入列表表尾
     * @param name
     * @param value
     * @returns {*}
     */
    rpush(name: string, value: string | number) {
        return this.wrap("rpush", [`${this.options.keyPrefix}${name}`, value]);
    }

    /**
     *
     *
     * @param {string} name
     * @param {(string | number)} value
     * @returns {*}
     * @memberof RedisStore
     */
    lpush(name: string, value: string | number) {
        return this.wrap("lpush", [`${this.options.keyPrefix}${name}`, value]);
    }

    /**
     * 将列表表头取出，并去除
     * @param name
     * @returns {*}
     */
    lpop(name: string) {
        return this.wrap("lpop", [`${this.options.keyPrefix}${name}`]);
    }

    /**
     *
     *
     * @param {string} name
     * @returns {*}
     * @memberof RedisStore
     */
    rpop(name: string) {
        return this.wrap("rpop", [`${this.options.keyPrefix}${name}`]);
    }

    /**
     * 返回列表 key 中指定区间内的元素，区间以偏移量 start 和 stop 指定
     * @param name
     * @param start
     * @param stop
     * @returns {*}
     */
    lrange(name: string, start: number, stop: number) {
        return this.wrap("lrange", [`${this.options.keyPrefix}${name}`, start, stop]);
    }

    /**
     * 集合新增
     * @param name
     * @param value
     * @param timeout
     * @returns {*}
     */
    sadd(name: string, value: string | number, timeout?: number) {
        const setP = [this.wrap("sadd", [`${this.options.keyPrefix}${name}`, value])];
        if (typeof timeout !== "number") {
            setP.push(this.wrap("expire", [`${this.options.keyPrefix}${name}`, timeout]));
        }

        return Promise.all(setP);
    }

    /**
     * 返回集合的基数(集合中元素的数量)
     * @param name
     * @returns {*}
     */
    scard(name: string) {
        return this.wrap("scard", [`${this.options.keyPrefix}${name}`]);
    }

    /**
     * 判断 member 元素是否集合的成员
     * @param name
     * @param key
     * @returns {*}
     */
    sismember(name: string, key: string) {
        return this.wrap("sismember", [`${this.options.keyPrefix}${name}`, key]);
    }

    /**
     * 返回集合中的所有成员
     * @param name
     * @returns {*}
     */
    smembers(name: string) {
        return this.wrap("smembers", [`${this.options.keyPrefix}${name}`]);
    }

    /**
     * 移除并返回集合中的一个随机元素
     * @param name
     * @returns {*}
     */
    spop(name: string) {
        return this.wrap("spop", [`${this.options.keyPrefix}${name}`]);
    }

    /**
     * 移除集合 key 中的一个 member 元素
     * @param name
     * @param key
     * @returns {*}
     */
    srem(name: string, key: string) {
        return this.wrap("srem", [`${this.options.keyPrefix}${name}`, key]);
    }

    /**
     * 将 member 元素从 source 集合移动到 destination 集合
     * @param source
     * @param destination
     * @param member
     * @returns {*}
     */
    smove(source: string, destination: string, member: string) {
        return this.wrap("smove", [`${this.options.keyPrefix}${source}`, `${this.options.keyPrefix}${destination}`, member]);
    }
}
