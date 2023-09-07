/**
 * @ Author: Hanrea
 * @ version: 2022-03-21 13:14:21
 * @ copyright: Vecmat (c) - <hi(at)vecmat.com>
 */
// tslint:disable-next-line: no-import-side-effect
import "reflect-metadata";
import lodash from "lodash";
import { CronJob } from "cron";
import { Locker } from "./locker";
import { StoreOptions } from "../store";
import { recursiveGetMetadata } from "./lib";
import { Exception, Check } from "@vecmat/vendor";
import { DefaultLogger as logger } from "@vecmat/printer";
import { Application, IOCContainer } from "../container";

const SCHEDULE_KEY = 'SCHEDULE_KEY';
// const APP_READY_HOOK = "APP_READY_HOOK";

/**
 * 
 *
 * @interface CacheStoreInterface
 */
export interface ScheduleLockerInterface {
    locker?: LockerInterface;
}
export interface LockerInterface {
    getClient?: () => Promise<any>;
    lock?: (key: string, expire?: number) => Promise<boolean>;
    waitLock?: (key: string, expire: number, interval?: number, waitTime?: number) => Promise<boolean>;
    unLock?: (key: string) => Promise<boolean>;
}
// 
const ScheduleLocker: ScheduleLockerInterface = {
    locker: null,
};


/**
 * get instances of cacheStore
 *
 * @export
 * @param {Application} app
 * @returns {*}  {CacheStore}
 */
export async function GetScheduleLocker(app: Application): Promise<LockerInterface> {
    if (!ScheduleLocker.locker) {
        const opt: StoreOptions = app.config("SchedulerLock", "db") ?? {};
        if (Check.isEmpty(opt)) {
            logger.Warn(`Missing configuration. Please write a configuration item with the key name 'SchedulerLock' in the db.ts file.`);
        }
        if (opt.type !== "redis") {
            throw  new Exception("SYSERR_LOCKER_TYPEUNSUITED",`ScheduleLocker depends on redis, please configure redis server. `);
        }
        const locker = Locker.getInstance(opt);
        if (locker && lodash.isFunction(locker.getClient)) {
            await locker.getClient();
            ScheduleLocker.locker = locker;
        } else {
            throw new Exception("SYSERR_LOCKER_MISSMETHOD",`Redis locker connection failed. `);
        }
    }
    return ScheduleLocker.locker;
}


/**
 * Initiation schedule locker client.
 *
 * @returns {*}  
 */
async function InitScheduleLocker() {
    const app = IOCContainer.getApp();
    app?.once("APP_BOOT_FINISH", async function () {
        await GetScheduleLocker(app);
    });
}

/**
 * Schedule task
 *
 * @export
 * @param {string} cron
 * * Seconds: 0-59
 * * Minutes: 0-59
 * * Hours: 0-23
 * * Day of Month: 1-31
 * * Months: 0-11 (Jan-Dec)
 * * Day of Week: 0-6 (Sun-Sat)
 * 
 * @returns {MethodDecorator}
 */
export function Scheduled(cron: string): MethodDecorator {
    if (Check.isEmpty(cron)) {
        // cron = "0 * * * * *";
        throw new Exception("SYSERR_DEMTH_MISSPARAMS","ScheduleJob rule is not defined");
    }

    return (target, propertyKey: string, descriptor: PropertyDescriptor) => {
        const componentType = IOCContainer.getType(target);
        if (componentType !== "MIXTURE" && componentType !== "COMPONENT") {
            throw new Exception("BOOTERR_DEPRO_UNSUITED", "This decorator only used in the mixture、component class.");
        }
        // IOCContainer.attachPropertyData(SCHEDULE_KEY, {
        //     cron,
        //     method: propertyKey
        // }, target, propertyKey);
        execInjectSchedule(target, propertyKey, cron);
    };
}

/**
 * Redis-based distributed locks. Redis server config from db.ts.
 *
 * @export
 * @param {string} [name] The locker name. If name is duplicated, lock sharing contention will result.
 * @param {number} [lockTimeOut] Automatic release of lock within a limited maximum time.
 * @param {number} [waitLockInterval] Try to acquire lock every interval time(millisecond).
 * @param {number} [waitLockTimeOut] When using more than TimeOut(millisecond) still fails to get the lock and return failure.
 * 
 * @returns {MethodDecorator}
 */
export function SchedulerLock(name?: string, lockTimeOut?: number, waitLockInterval?: number, waitLockTimeOut?: number): MethodDecorator {
    return (target: any, methodName: string, descriptor: PropertyDescriptor) => {
        const componentType = IOCContainer.getType(target);
        if (componentType !== "MIXTURE" && componentType !== "COMPONENT") {
            throw new Exception("BOOTERR_DEPRO_UNSUITED", "This decorator only used in the mixture、component class.");
        }
        const { value, configurable, enumerable } = descriptor;
        if (Check.isEmpty(name)) {
            const identifier = IOCContainer.getIdentifier(target) || (target.constructor ? target.constructor.name : "");
            name = `${identifier}_${methodName}`;
        }

        descriptor = {
            configurable,
            enumerable,
            writable: true,
            async value(...props: any[]) {
                const lockerCls = ScheduleLocker.locker;
                let lockerFlag = false;
                if (!lockerCls) {
                    throw  new Exception("SYSERR_LOCKER_UNINIT",`Cache lock '${name}' acquisition failed. The method ${methodName} is not executed.`);
                }
                if (waitLockInterval || waitLockTimeOut) {
                    lockerFlag = await lockerCls.waitLock(name,
                        lockTimeOut,
                        waitLockInterval,
                        waitLockTimeOut
                    ).catch((er: any) => {
                        logger.Error(er);
                        return false;
                    });
                } else {
                    lockerFlag = await lockerCls.lock(name, lockTimeOut).catch((er: any) => {
                        logger.Error(er);
                        return false;
                    });
                }
                if (lockerFlag) {
                    try {
                        logger.Info(`The locker '${name}' executed.`);
                        // tslint:disable-next-line: no-invalid-this
                        const res = await value.apply(this, props);
                        return res;
                    } catch (e) {
                        return Promise.reject(e);
                    } finally {
                        if (lockerCls.unLock) {
                            await lockerCls.unLock(name).catch((er: any) => {
                                logger.Error(er);
                            });
                        }
                    }
                } else {
                    logger.Warn(`Cache lock '${name}' acquisition failed. The method ${methodName} is not executed.`);
                    return;
                }
            }
        };

        // bind app_ready hook event 
        InitScheduleLocker();
        return descriptor;
    };
}

/**
 * Redis-based distributed locks. Redis server config from db.ts.
 *
 * @export
 * @param {string} [name] The locker name. If name is duplicated, lock sharing contention will result.
 * @param {number} [lockTimeOut] Automatic release of lock within a limited maximum time.
 * @param {number} [waitLockInterval] Try to acquire lock every interval time(millisecond).
 * @param {number} [waitLockTimeOut] When using more than TimeOut(millisecond) still fails to get the lock and return failure.
 *
 * @returns {MethodDecorator}
 */
export const Lock = SchedulerLock;

/**
 * 
 *
 * @param {*} target
 * @param {Container} container
 * @param {string} method
 * @param {string} cron
 */
const execInjectSchedule = function (target: any, method: string, cron: string) {
    const app = IOCContainer.getApp();
    app?.once("APP_BOOT_FINISH", () => {
        const identifier = IOCContainer.getIdentifier(target);
        const componentType = IOCContainer.getType(target);
        const instance: any = IOCContainer.get(identifier, componentType);

        if (instance && lodash.isFunction(instance[method]) && cron) {
            logger.Debug(`Register inject ${identifier} schedule key: ${method} => value: ${cron}`);
            new CronJob(cron, async function () {
                logger.Info(`The schedule job ${identifier}_${method} started.`);
                try {
                    const res = await instance[method]();
                    return res;
                } catch (e) {
                    logger.Error(e);
                }
            }).start();
        }
    });
};

/**
 * Inject schedule job
 *
 * @export
 * @param {*} target
 */
export function injectSchedule(target: any) {
    const metaDatas = recursiveGetMetadata(SCHEDULE_KEY, target);
    // tslint:disable-next-line: forin
    for (const meta in metaDatas) {
        for (const val of metaDatas[meta]) {
            if (val.cron && meta) {
                execInjectSchedule(target, meta, val.cron);
            }
        }
    }
}