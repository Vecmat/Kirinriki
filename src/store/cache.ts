/**
 * @ Author: Hanrea
 * @ version: 2022-03-21 13:14:21
 * @ copyright: Vecmat (c) - <hi(at)vecmat.com>
 */
import { EventEmitter } from "events";
import { Exception, Helper } from "@vecmat/vendor";
import { flatten, isNil, isUndefined, union } from "lodash";

/**
 *
 *
 * @enum {number}
 */
export enum messages {
    ok = "OK",
    queued = "QUEUED",
    pong = "PONG",
    noint = "ERR value is not an integer or out of range",
    nofloat = "ERR value is not an float or out of range",
    nokey = "ERR no such key",
    nomultiinmulti = "ERR MULTI calls can not be nested",
    nomultiexec = "ERR EXEC without MULTI",
    nomultidiscard = "ERR DISCARD without MULTI",
    busykey = "ERR target key name is busy",
    syntax = "ERR syntax error",
    unsupported = "MemoryCache does not support that operation",
    wrongTypeOp = "WRONGTYPE Operation against a key holding the wrong kind of value",
    wrongPayload = "DUMP payload version or checksum are wrong",
    wrongArgCount = "ERR wrong number of arguments for '%0' command",
    bitopnotWrongCount = "ERR BITOP NOT must be called with a single source key",
    indexOutOfRange = "ERR index out of range",
    invalidLexRange = "ERR min or max not valid string range item",
    invalidDBIndex = "ERR invalid DB index",
    invalidDBIndexNX = "ERR invalid DB index, '%0' does not exist",
    mutuallyExclusiveNXXX = "ERR XX and NX options at the same time are not compatible"
}

/**
 *
 *
 * @interface MemoryCacheOptions
 */
interface MemoryCacheOptions {
    database: number;
}

export class MemoryCache extends EventEmitter {
    private databases: any = Object.create({});
    options: MemoryCacheOptions;
    currentDBIndex: number;
    connected: boolean;
    lastSave: number;
    multiMode: boolean;
    private cache: any;
    private tempCache: any;
    private responseMessages: any[];

    /**
     * Creates an instance of MemoryCache.
     * @param {*} options
     * @memberof MemoryCache
     */
    constructor(options: MemoryCacheOptions) {
        super();
        this.options = { ...{ database: "0" }, ...options };
        this.currentDBIndex = 0;
        this.connected = false;
        this.lastSave = Date.now();
        this.multiMode = false;
    }

    /**
     *
     *
     * @returns {*}
     * @memberof MemoryCache
     */
    createClient() {
        this.databases[this.options.database] = Object.create({});
        this.cache = this.databases[this.options.database];
        this.connected = true;
        // exit multi mode if we are in it
        this.discard(null, true);
        this.emit("connect");
        this.emit("ready");
        return this;
    }

    /**
     *
     *
     * @returns {*}
     * @memberof MemoryCache
     */
    quit() {
        this.connected = false;
        // exit multi mode if we are in it
        this.discard(null, true);
        this.emit("end");
        return this;
    }

    /**
     *
     *
     * @returns {*}
     * @memberof MemoryCache
     */
    end() {
        return this.quit();
    }

    /**
     *
     *
     * @param {string} message
     * @param {Function} [callback]
     * @returns {*}
     * @memberof MemoryCache
     */
    echo(message: string, callback?: Function) {
        return this._handleCallback(callback, message);
    }

    /**
     *
     *
     * @param {string} message
     * @param {Function} [callback]
     * @returns {*}
     * @memberof MemoryCache
     */
    ping(message: string, callback?: Function) {
        message = message || messages.pong;
        return this._handleCallback(callback, message);
    }

    /**
     *
     *
     * @param {string} password
     * @param {Function} [callback]
     * @returns {*}
     * @memberof MemoryCache
     */
    auth(password: string, callback?: Function) {
        return this._handleCallback(callback, messages.ok);
    }

    /**
     *
     *
     * @param {number} dbIndex
     * @param {Function} [callback]
     * @returns {*}
     * @memberof MemoryCache
     */
    select(dbIndex: number, callback?: Function) {
        if (!Helper.isNumber(dbIndex)) {
            return this._handleCallback(callback, null, messages.invalidDBIndex);
        }
        if (!this.databases.hasOwnProperty(dbIndex)) {
            this.databases[dbIndex] = Object.create({});
        }
        this.multiMode = false;
        this.currentDBIndex = dbIndex;
        this.cache = this.databases[dbIndex];

        return this._handleCallback(callback, messages.ok);
    }

    // ---------------------------------------
    // Keys
    // ---------------------------------------
    get(key: string, callback?: Function) {
        let retVal = null;
        if (this._hasKey(key)) {
            this._testType(key, "string", true, callback);
            retVal = this._getKey(key);
        }
        return this._handleCallback(callback, retVal);
    }

    /**
     * set(key, value, ttl, pttl, notexist, onlyexist, callback)
     *
     * @param {string} key
     * @param {(string | number)} value
     * @param {...any[]} params
     * @returns {*}
     * @memberof MemoryCache
     */
    set(key: string, value: string | number, ...params: any[]) {
        const retVal: string | number = null;
        params = flatten(params);
        const callback = this._retrieveCallback(params);
        let ttl, pttl, notexist, onlyexist;
        // parse parameters
        while (params.length > 0) {
            const param = params.shift();
            switch (param.toString().toLowerCase()) {
                case "nx":
                    notexist = true;
                    break;
                case "xx":
                    onlyexist = true;
                    break;
                case "ex":
                    if (params.length === 0) {
                        return this._handleCallback(callback, null, messages.syntax);
                    }
                    ttl = parseInt(params.shift());
                    if (isNaN(ttl)) {
                        return this._handleCallback(callback, null, messages.noint);
                    }
                    break;
                case "px":
                    if (params.length === 0) {
                        return this._handleCallback(callback, null, messages.syntax);
                    }
                    pttl = parseInt(params.shift());
                    if (isNaN(pttl)) {
                        return this._handleCallback(callback, null, messages.noint);
                    }
                    break;
                default:
                    return this._handleCallback(callback, null, messages.syntax);
            }
        }

        if (!isNil(ttl) && !isNil(pttl)) {
            return this._handleCallback(callback, null, messages.syntax);
        }

        if (notexist && onlyexist) {
            return this._handleCallback(callback, null, messages.syntax);
        }

        pttl = pttl || ttl * 1000 || null;
        if (!isNil(pttl)) {
            pttl = Date.now() + pttl;
        }
        if (this._hasKey(key)) {
            this._testType(key, "string", true, callback);
            if (notexist) {
                return this._handleCallback(callback, retVal);
            }
        } else if (onlyexist) {
            return this._handleCallback(callback, retVal);
        }
        this.cache[key] = this._makeKey(value.toString(), "string", pttl);

        return this._handleCallback(callback, messages.ok);
    }

    /**
     *
     *
     * @param {string} key
     * @param {Function} [callback]
     * @returns {*}
     * @memberof MemoryCache
     */
    ttl(key: string, callback?: Function) {
        let retVal = this.pttl(key);
        if (retVal >= 0 || retVal <= -3) {
            retVal = Math.floor(retVal / 1000);
        }
        return this._handleCallback(callback, retVal);
    }

    /**
     *
     *
     * @param {string} key
     * @param {number} seconds
     * @param {Function} [callback]
     * @returns {*}
     * @memberof MemoryCache
     */
    expire(key: string, seconds: number, callback?: Function) {
        let retVal = 0;
        if (this._hasKey(key)) {
            this.cache[key].timeout = Date.now() + seconds * 1000;
            retVal = 1;
        }
        return this._handleCallback(callback, retVal);
    }

    /**
     *
     *
     * @param {...any[]} keys
     * @returns {*}
     * @memberof MemoryCache
     */
    del(...keys: any[]) {
        let retVal = 0;
        const callback = this._retrieveCallback(keys);
        // Flatten the array in case an array was passed
        keys = flatten(keys);

        for (let itr = 0; itr < keys.length; itr++) {
            const key = keys[itr];
            if (this._hasKey(key)) {
                delete this.cache[key];
                retVal++;
            }
        }

        return this._handleCallback(callback, retVal);
    }

    /**
     *
     *
     * @param {...any[]} keys
     * @returns {*}
     * @memberof MemoryCache
     */
    exists(...keys: any[]) {
        let retVal = 0;
        const callback = this._retrieveCallback(keys);

        for (let itr = 0; itr < keys.length; itr++) {
            const key = keys[itr];
            if (this._hasKey(key)) {
                retVal++;
            }
        }
        return this._handleCallback(callback, retVal);
    }

    /**
     *
     *
     * @param {string} key
     * @param {Function} [callback]
     * @returns {*}
     * @memberof MemoryCache
     */
    incr(key: string, callback?: Function) {
        let retVal = null;
        try {
            retVal = this._addToKey(key, 1);
        } catch (err) {
            return this._handleCallback(callback, null, err);
        }
        return this._handleCallback(callback, retVal);
    }

    /**
     *
     *
     * @param {string} key
     * @param {number} amount
     * @param {Function} [callback]
     * @returns {*}
     * @memberof MemoryCache
     */
    incrby(key: string, amount: number, callback?: Function) {
        let retVal = null;
        try {
            retVal = this._addToKey(key, amount);
        } catch (err) {
            return this._handleCallback(callback, null, err);
        }
        return this._handleCallback(callback, retVal);
    }

    /**
     *
     *
     * @param {string} key
     * @param {Function} [callback]
     * @returns {*}
     * @memberof MemoryCache
     */
    decr(key: string, callback?: Function) {
        let retVal = null;
        try {
            retVal = this._addToKey(key, -1);
        } catch (err) {
            return this._handleCallback(callback, null, err);
        }
        return this._handleCallback(callback, retVal);
    }

    /**
     *
     *
     * @param {string} key
     * @param {number} amount
     * @param {Function} [callback]
     * @returns {*}
     * @memberof MemoryCache
     */
    decrby(key: string, amount: number, callback?: Function) {
        let retVal = null;
        try {
            retVal = this._addToKey(key, -amount);
        } catch (err) {
            return this._handleCallback(callback, null, err);
        }
        return this._handleCallback(callback, retVal);
    }

    // ---------------------------------------
    // ## Hash ##
    // ---------------------------------------
    hset(key: string, field: string, value: string | number, callback?: Function) {
        let retVal = 0;
        if (this._hasKey(key)) {
            this._testType(key, "hash", true, callback);
        } else {
            this.cache[key] = this._makeKey({}, "hash");
        }

        if (!this._hasField(key, field)) {
            retVal = 1;
        }

        this._setField(key, field, value.toString());
        this.persist(key);

        return this._handleCallback(callback, retVal);
    }

    /**
     *
     *
     * @param {string} key
     * @param {string} field
     * @param {Function} [callback]
     * @returns {*}
     * @memberof MemoryCache
     */
    hget(key: string, field: string, callback?: Function) {
        let retVal = null;
        if (this._hasKey(key)) {
            this._testType(key, "hash", true, callback);
            if (this._hasField(key, field)) {
                retVal = this._getKey(key)[field];
            }
        }
        return this._handleCallback(callback, retVal);
    }

    /**
     *
     *
     * @param {string} key
     * @param {string} field
     * @param {Function} [callback]
     * @returns {*}
     * @memberof MemoryCache
     */
    hexists(key: string, field: string, callback?: Function) {
        let retVal = 0;
        if (this._hasKey(key)) {
            this._testType(key, "hash", true, callback);
            if (this._hasField(key, field)) {
                retVal = 1;
            }
        }
        return this._handleCallback(callback, retVal);
    }

    /**
     *
     *
     * @param {string} key
     * @param {...any[]} fields
     * @returns {*}
     * @memberof MemoryCache
     */
    hdel(key: string, ...fields: any[]) {
        let retVal = 0;
        const callback = this._retrieveCallback(fields);
        if (this._hasKey(key)) {
            this._testType(key, "hash", true, callback);
            for (let itr = 0; itr < fields.length; itr++) {
                const field = fields[itr];
                if (this._hasField(key, field)) {
                    delete this.cache[key].value[field];
                    retVal++;
                }
            }
        }
        return this._handleCallback(callback, retVal);
    }

    /**
     *
     *
     * @param {string} key
     * @param {Function} [callback]
     * @returns {*}
     * @memberof MemoryCache
     */
    hlen(key: string, callback?: Function) {
        const retVal = this.hkeys(key).length;
        return this._handleCallback(callback, retVal);
    }

    /**
     *
     *
     * @param {string} key
     * @param {string} field
     * @param {*} value
     * @param {Function} [callback]
     * @returns {*}
     * @memberof MemoryCache
     */
    hincrby(key: string, field: string, value: any, callback?: Function) {
        let retVal;
        try {
            retVal = this._addToField(key, field, value, false);
        } catch (err) {
            return this._handleCallback(callback, null, err);
        }
        return this._handleCallback(callback, retVal);
    }

    /**
     *
     *
     * @param {string} key
     * @param {Function} [callback]
     * @returns {*}
     * @memberof MemoryCache
     */
    hgetall(key: string, callback?: Function) {
        let retVals = {};
        if (this._hasKey(key)) {
            this._testType(key, "hash", true, callback);
            retVals = this._getKey(key);
        }
        return this._handleCallback(callback, retVals);
    }

    /**
     *
     *
     * @param {string} key
     * @param {Function} [callback]
     * @returns {*}
     * @memberof MemoryCache
     */
    hkeys(key: string, callback?: Function) {
        let retVals: any[] = [];
        if (this._hasKey(key)) {
            this._testType(key, "hash", true, callback);
            retVals = Object.keys(this._getKey(key));
        }

        return this._handleCallback(callback, retVals);
    }

    /**
     *
     *
     * @param {string} key
     * @param {Function} [callback]
     * @returns {*}
     * @memberof MemoryCache
     */
    hvals(key: string, callback?: Function) {
        let retVals: any[] = [];
        if (this._hasKey(key)) {
            this._testType(key, "hash", true, callback);
            retVals = Object.values(this._getKey(key));
        }

        return this._handleCallback(callback, retVals);
    }

    // ---------------------------------------
    // Lists (Array / Queue / Stack)
    // ---------------------------------------

    /**
     *
     *
     * @param {string} key
     * @param {Function} [callback]
     * @returns {*}
     * @memberof MemoryCache
     */
    llen(key: string, callback?: Function) {
        let retVal = 0;
        if (this._hasKey(key)) {
            this._testType(key, "list", true, callback);
            retVal = this._getKey(key).length || 0;
        }

        return this._handleCallback(callback, retVal);
    }

    /**
     *
     *
     * @param {string} key
     * @param {(string | number)} value
     * @param {Function} [callback]
     * @returns {*}
     * @memberof MemoryCache
     */
    rpush(key: string, value: string | number, callback?: Function) {
        let retVal = 0;
        if (this._hasKey(key)) {
            this._testType(key, "list", true, callback);
        } else {
            this.cache[key] = this._makeKey([], "list");
        }

        const val = this._getKey(key);
        val.push(value);
        this._setKey(key, val);
        retVal = val.length;
        return this._handleCallback(callback, retVal);
    }

    /**
     *
     *
     * @param {string} key
     * @param {(string | number)} value
     * @param {Function} [callback]
     * @returns {*}
     * @memberof MemoryCache
     */
    lpush(key: string, value: string | number, callback?: Function) {
        let retVal = 0;
        if (this._hasKey(key)) {
            this._testType(key, "list", true, callback);
        } else {
            this.cache[key] = this._makeKey([], "list");
        }

        const val = this._getKey(key);
        val.splice(0, 0, value);
        this._setKey(key, val);
        retVal = val.length;
        return this._handleCallback(callback, retVal);
    }

    /**
     *
     *
     * @param {string} key
     * @param {Function} [callback]
     * @returns {*}
     * @memberof MemoryCache
     */
    lpop(key: string, callback?: Function) {
        let retVal = null;
        if (this._hasKey(key)) {
            this._testType(key, "list", true, callback);
            const val = this._getKey(key);
            retVal = val.shift();
            this._setKey(key, val);
        }

        return this._handleCallback(callback, retVal);
    }

    /**
     *
     *
     * @param {string} key
     * @param {Function} [callback]
     * @returns {*}
     * @memberof MemoryCache
     */
    rpop(key: string, callback?: Function) {
        let retVal = null;
        if (this._hasKey(key)) {
            this._testType(key, "list", true, callback);
            const val = this._getKey(key);
            retVal = val.pop();
            this._setKey(key, val);
        }

        return this._handleCallback(callback, retVal);
    }

    /**
     *
     *
     * @param {string} key
     * @param {number} start
     * @param {number} stop
     * @param {Function} [callback]
     * @returns {*}
     * @memberof MemoryCache
     */
    lrange(key: string, start: number, stop: number, callback?: Function) {
        const retVal = [];
        if (this._hasKey(key)) {
            this._testType(key, "list", true, callback);
            const val = this._getKey(key);
            const length = val.length;
            if (stop < 0) {
                stop = length + stop;
            }
            if (start < 0) {
                start = length + start;
            }
            if (start < 0) {
                start = 0;
            }
            if (stop >= length) {
                stop = length - 1;
            }
            if (stop >= 0 && stop >= start) {
                const size = stop - start + 1;
                for (let itr = start; itr < size; itr++) {
                    retVal.push(val[itr]);
                }
            }
        }
        return this._handleCallback(callback, retVal);
    }

    // ---------------------------------------
    // ## Sets (Unique Lists)##
    // ---------------------------------------

    /**
     *
     *
     * @param {string} key
     * @param {...any[]} members
     * @returns {*}
     * @memberof MemoryCache
     */
    sadd(key: string, ...members: string[]) {
        let retVal = 0;
        const callback = this._retrieveCallback(members);
        if (this._hasKey(key)) {
            this._testType(key, "set", true, callback);
        } else {
            this.cache[key] = this._makeKey([], "set");
        }
        const val = this._getKey(key);
        const length = val.length;
        const nval = union(val, members);
        const newlength = nval.length;
        retVal = newlength - length;
        this._setKey(key, nval);

        return this._handleCallback(callback, retVal);
    }

    /**
     *
     *
     * @param {string} key
     * @param {Function} [callback]
     * @returns {*}
     * @memberof MemoryCache
     */
    scard(key: string, callback?: Function) {
        let retVal = 0;
        if (this._hasKey(key)) {
            this._testType(key, "set", true, callback);
            retVal = this._getKey(key).length;
        }
        return this._handleCallback(callback, retVal);
    }

    /**
     *
     *
     * @param {string} key
     * @param {string} member
     * @param {Function} [callback]
     * @returns {*}
     * @memberof MemoryCache
     */
    sismember(key: string, member: string, callback?: Function) {
        let retVal = 0;
        if (this._hasKey(key)) {
            this._testType(key, "set", true, callback);
            const val = this._getKey(key);
            if (val.includes(member)) {
                retVal = 1;
            }
        }

        return this._handleCallback(callback, retVal);
    }

    /**
     *
     *
     * @param {string} key
     * @param {Function} [callback]
     * @returns {*}
     * @memberof MemoryCache
     */
    smembers(key: string, callback?: Function) {
        let retVal = [];
        if (this._hasKey(key)) {
            this._testType(key, "set", true, callback);
            retVal = this._getKey(key);
        }
        return this._handleCallback(callback, retVal);
    }

    /**
     *
     *
     * @param {string} key
     * @param {number} [count]
     * @param {Function} [callback]
     * @returns {*}
     * @memberof MemoryCache
     */
    spop(key: string, count?: number, callback?: Function) {
        let retVal = null;
        count = count || 1;
        if (isNaN(count)) {
            return this._handleCallback(callback, null, messages.noint);
        }

        if (this._hasKey(key)) {
            retVal = [];
            this._testType(key, "set", true, callback);
            const val = this._getKey(key);
            const length = val.length;
            count = count > length ? length : count;
            for (let itr = 0; itr < count; itr++) {
                retVal.push(val.pop());
            }
        }

        return this._handleCallback(callback, retVal);
    }

    /**
     *
     *
     * @param {string} key
     * @param {...any[]} members
     * @returns {*}
     * @memberof MemoryCache
     */
    srem(key: string, ...members: any[]) {
        let retVal = 0;
        const callback = this._retrieveCallback(members);
        if (this._hasKey(key)) {
            this._testType(key, "set", true, callback);
            const val = this._getKey(key);
            for (const index in members) {
                if (members.hasOwnProperty(index)) {
                    const member = members[index];
                    const idx = val.indexOf(member);
                    if (idx !== -1) {
                        val.splice(idx, 1);
                        retVal++;
                    }
                }
            }
            this._setKey(key, val);
        }
        return this._handleCallback(callback, retVal);
    }

    /**
     *
     *
     * @param {string} sourcekey
     * @param {string} destkey
     * @param {string} member
     * @param {Function} [callback]
     * @returns {*}
     * @memberof MemoryCache
     */
    smove(sourcekey: string, destkey: string, member: string, callback?: Function) {
        let retVal = 0;
        if (this._hasKey(sourcekey)) {
            this._testType(sourcekey, "set", true, callback);
            const val = this._getKey(sourcekey);
            const idx = val.indexOf(member);
            if (idx !== -1) {
                this.sadd(destkey, member);
                val.splice(idx, 1);
                retVal = 1;
            }
        }
        return this._handleCallback(callback, retVal);
    }

    // ---------------------------------------
    // ## Transactions (Atomic) ##
    // ---------------------------------------
    // TODO: Transaction Queues watch and unwatch
    // https://redis.io/topics/transactions
    // This can be accomplished by temporarily swapping this.cache to a temporary copy of the current statement
    // holding and then using __.merge on actual this.cache with the temp storage.
    discard(callback?: Function, silent?: boolean) {
        // Clear the queue mode, drain the queue, empty the watch list
        if (this.multiMode) {
            this.cache = this.databases[this.currentDBIndex];
            this.tempCache = {};
            this.multiMode = false;
            this.responseMessages = [];
        } else if (!silent) {
            return this._handleCallback(callback, null, messages.nomultidiscard);
        }
        return this._handleCallback(callback, messages.ok);
    }

    // ---------------------------------------
    // ## Internal - Key ##
    // ---------------------------------------

    /**
     *
     *
     * @param {string} key
     * @param {Function} [callback]
     * @returns {*}
     * @memberof MemoryCache
     */
    private pttl(key: string, callback?: Function): number {
        let retVal = -2;
        if (this._hasKey(key)) {
            if (!isNil(this.cache[key].timeout)) {
                retVal = this.cache[key].timeout - Date.now();
                // Prevent unexpected errors if the actual ttl just happens to be -2 or -1
                if (retVal < 0 && retVal > -3) {
                    retVal = -3;
                }
            } else {
                retVal = -1;
            }
        }
        return <number>this._handleCallback(callback, retVal);
    }

    /**
     *
     *
     * @private
     * @param {string} key
     * @param {Function} [callback]
     * @returns {*}
     * @memberof MemoryCache
     */
    private persist(key: string, callback?: Function) {
        let retVal = 0;
        if (this._hasKey(key)) {
            if (!isNil(this._key(key).timeout)) {
                this._key(key).timeout = null;
                retVal = 1;
            }
        }
        return this._handleCallback(callback, retVal);
    }

    /**
     *
     *
     * @private
     * @param {string} key
     * @returns {*}  {boolean}
     * @memberof MemoryCache
     */
    private _hasKey(key: string) {
        return this.cache.hasOwnProperty(key);
    }

    /**
     *
     *
     * @private
     * @param {*} value
     * @param {string} type
     * @param {number} timeout
     * @returns {*}
     * @memberof MemoryCache
     */
    private _makeKey(value: any, type: string, timeout?: number) {
        return { value: value, type: type, timeout: timeout || null, lastAccess: Date.now() };
    }

    /**
     *
     *
     * @private
     * @param {string} key
     * @returns {*}
     * @memberof MemoryCache
     */
    private _key(key: string) {
        this.cache[key].lastAccess = Date.now();
        return this.cache[key];
    }

    /**
     *
     *
     * @private
     * @param {string} key
     * @param {number} amount
     * @param {Function} [callback]
     * @returns {*}
     * @memberof MemoryCache
     */
    private _addToKey(key: string, amount: number, callback?: Function) {
        let keyValue = 0;
        if (isNaN(amount) || isNil(amount)) {
            return this._handleCallback(callback, null, messages.noint);
        }

        if (this._hasKey(key)) {
            this._testType(key, "string", true, callback);
            keyValue = parseInt(this._getKey(key));
            if (isNaN(keyValue) || isNil(keyValue)) {
                return this._handleCallback(callback, null, messages.noint);
            }
        } else {
            this.cache[key] = this._makeKey("0", "string");
        }
        const val = keyValue + amount;
        this._setKey(key, val.toString());
        return val;
    }

    /**
     *
     *
     * @private
     * @param {string} key
     * @param {string} type
     * @param {boolean} [throwError]
     * @param {Function} [callback]
     * @returns {*}
     * @memberof MemoryCache
     */
    private _testType(key: string, type: string, throwError?: boolean, callback?: Function) {
        throwError = !!throwError;
        const keyType = this._key(key).type;
        if (keyType !== type) {
            if (throwError) {
                return this._handleCallback(callback, null, messages.wrongTypeOp);
            }
            return false;
        }
        return true;
    }

    /**
     *
     *
     * @private
     * @param {string} key
     * @returns {*}
     * @memberof MemoryCache
     */
    private _getKey(key: string) {
        const _key = this._key(key) || {};
        if (_key.timeout && _key.timeout <= Date.now()) {
            this.del(key);
            return null;
        }
        return _key.value;
    }

    /**
     *
     *
     * @private
     * @param {string} key
     * @param {(number | string)} value
     * @memberof MemoryCache
     */
    private _setKey(key: string, value: any) {
        this.cache[key].value = value;
        this.cache[key].lastAccess = Date.now();
    }

    /**
     *
     *
     * @private
     * @param {string} key
     * @param {string} field
     * @param {number} [amount]
     * @param {boolean} [useFloat]
     * @param {Function} [callback]
     * @returns {*}
     * @memberof MemoryCache
     */
    private _addToField(key: string, field: string, amount?: number, useFloat?: boolean, callback?: Function) {
        useFloat = useFloat || false;
        let fieldValue = useFloat ? 0.0 : 0;
        let value = 0;

        if (isNaN(amount) || isNil(amount)) {
            return this._handleCallback(callback, null, useFloat ? messages.nofloat : messages.noint);
        }

        if (this._hasKey(key)) {
            this._testType(key, "hash", true, callback);
            if (this._hasField(key, field)) {
                value = this._getField(key, field);
            }
        } else {
            this.cache[key] = this._makeKey({}, "hash");
        }

        fieldValue = useFloat ? parseFloat(`${value}`) : parseInt(`${value}`);
        amount = useFloat ? parseFloat(`${amount}`) : parseInt(`${amount}`);
        if (isNaN(fieldValue) || isNil(fieldValue)) {
            return this._handleCallback(callback, null, useFloat ? messages.nofloat : messages.noint);
        }

        fieldValue += amount;
        this._setField(key, field, fieldValue.toString());
        return fieldValue;
    }

    /**
     *
     *
     * @private
     * @param {string} key
     * @param {string} field
     * @returns {*}
     * @memberof MemoryCache
     */
    private _getField(key: string, field: string) {
        return this._getKey(key)[field];
    }

    /**
     *
     *
     * @private
     * @param {string} key
     * @param {string} field
     * @returns {*}  {boolean}
     * @memberof MemoryCache
     */
    private _hasField(key: string, field: string) {
        let retVal = false;
        if (key && field) {
            const ky = this._getKey(key);
            if (ky) {
                retVal = ky.hasOwnProperty(field);
            }
        }
        return retVal;
    }

    /**
     *
     *
     * @param {string} key
     * @param {string} field
     * @param {*} value
     * @memberof MemoryCache
     */
    _setField(key: string, field: string, value: any) {
        this._getKey(key)[field] = value;
    }

    /**
     *
     *
     * @private
     * @param {Function} [callback]
     * @param {(any)} [message]
     * @param {*} [error]
     * @param {boolean} [nolog]
     * @returns {*}
     * @memberof MemoryCache
     */
    private _handleCallback(callback?: Function, message?: any, error?: any, nolog?: boolean) {
        let err = error;
        let msg = message;
        nolog = isNil(nolog) ? true : nolog;
        if (nolog) {
            err = this._logReturn(error);
            msg = this._logReturn(message);
        }
        if (typeof callback === "function") {
            callback(err, msg);
            return;
        }
        if (err) {
            throw new Exception("SYSERR_CACHE_UNKOWM", err.message);
        }
        return msg;
    }

    private _logReturn(message: string | number) {
        if (!isUndefined(message)) {
            if (this.multiMode) {
                if (!isNil(this.responseMessages)) {
                    this.responseMessages.push(message);
                    if (message === messages.ok) {
                        message = messages.queued;
                    }
                }
            }
            return message;
        }
        return;
    }

    /**
     *
     *
     * @private
     * @param {any[]} [params]
     * @returns {*}
     * @memberof MemoryCache
     */
    private _retrieveCallback(params?: any[]) {
        if (Array.isArray(params) && params.length > 0 && typeof params[params.length - 1] === "function") {
            return params.pop();
        }
        return;
    }
}
