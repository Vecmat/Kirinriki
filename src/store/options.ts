/**
 *
 *
 * @export
 * @interface StoreOptions
 */
export interface StoreOptions {
    type?: string;
    keyPrefix?: string;
    host?: string | Array<string>;
    port?: number | Array<number>;
    username?: string;
    password?: string;
    db?: number;
    timeout?: number; // seconds
    poolSize?: number;
    connectTimeout?: number; // milliseconds

    // sentinel
    name?: string;
    sentinelUsername?: string;
    sentinelPassword?: string;
    sentinels?: Array<{ host: string; port: number }>;

    // cluster
    clusters?: Array<{ host: string; port: number }>;
}
