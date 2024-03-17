/**
 * @ Author: Hanrea
 * @ version: 2022-03-21 13:14:21
 * @ copyright: Vecmat (c) - <hi(at)vecmat.com>
 */
// tslint:disable-next-line: no-import-side-effect
import "reflect-metadata";
import lodash from "lodash";
import { injectValues } from "./Values.js";
import { Check, IObjExt } from "@vecmat/vendor";
import { injectAutowired } from "./Autowired.js";
import { Kirinriki } from "../core/Application.js";
import { IContainer, ObjectDefinitionOptions, ComponentType, TAGGED_CLS } from "./IContainer.js";

/**
 * IOC Container
 *
 * @export
 * @class Container
 * @implements {IContainer}
 */
export class Container implements IContainer {
    private app!: Kirinriki;
    private classMap: Map<any, any>;
    private instanceMap: WeakMap<any, any>;
    private metadataMap: WeakMap<any, any>;
    private static instance: Container;

    /**
     *
     *
     * @static
     * @returns
     * @memberof ValidateUtil
     */
    static getInstance() {
        return this.instance || (this.instance = new Container());
    }

    /**
     * creates an instance of Container.
     * @param {*} app
     * @memberof Container
     */
    private constructor() {
        this.classMap = new Map();
        this.instanceMap = new WeakMap();
        this.metadataMap = new WeakMap();
    }

    /**
     * set app
     *
     * @param {Kirinriki} app
     * @returns
     * @memberof Container
     */
    public setApp(app: Kirinriki) {
        this.app = app;
    }

    /**
     * get app
     *
     * @returns
     * @memberof Container
     */
    public getApp() {
        return this.app;
    }

    /**
     * registering an instance of a class to an IOC container.
     *
     * @template T
     * @param {T} target
     * @param {ObjectDefinitionOptions} [options]
     * @returns {T}
     * @memberof Container
     */
    public reg<T>(target: T, options?: ObjectDefinitionOptions): T | undefined;
    public reg<T>(identifier: string, target: T, options?: ObjectDefinitionOptions): T | undefined;
    public reg<T>(identifier: any, target?: any, options?: ObjectDefinitionOptions): T | undefined {
        if (Check.isClass(identifier) || lodash.isFunction(identifier)) {
            options = target;
            target = identifier as any;
            identifier = this.getIdentifier(target);
        }
        if (!Check.isClass(target)) {
            return target;
        }

        let instance = this.instanceMap.get(target);
        if (!instance) {
            options = {
                isAsync: false,
                initMethod: "constructor",
                destroyMethod: "distructor",
                scope: "Singleton",
                type: "COMPONENT",
                args: [],
                ...options
            };

            options.args = options.args.length ? options.args : [];
            // inject options once
            Reflect.defineProperty(target.prototype, "_options", {
                enumerable: false,
                configurable: false,
                writable: true,
                value: options
            });

            // define app as getter
            const app = this.app;
            Reflect.defineProperty(target.prototype, "app", {
                get() {
                    return app;
                },
                configurable: false,
                enumerable: false
            });

            // inject properties values
            injectValues(target, target.prototype, this);
            // inject autowired
            injectAutowired(target, target.prototype, this);

            const ref = this.getClass(identifier, options.type);
            if (!ref) {
                this.saveClass(options.type, target, identifier);
            }

            if (options.scope == "Connect") {
                return;
            }
            // instantiation
            instance = Reflect.construct(target, options.args);
            if (options.scope === "Singleton") {
                instance = Object.seal(instance);
            }
            // registration
            this.instanceMap.set(target, instance);
        }
        return instance;
    }

    /**
     * get instance from IOC container.
     *
     * @param {string} identifier
     * @param {ComponentType} [type="COMPONENT"]
     * @param {any[]} [args=[]]
     * @returns {*}
     * @memberof Container
     */
    public get(identifier: string, type: ComponentType, args: any[] = []): any {
        // const [,t] = identifier.match(/(\S+):/);
        // type = type || <ComponentType> t;
        const target = this.getClass(identifier, type);
        if (!target) {
            return null;
        }
        // get instance from the Container
        const instance: any = this.instanceMap.get(target);
        // require Prototype instance
        if (args.length > 0) {
            // instantiation
            return Reflect.construct(target, args);
        } else {
            return instance;
        }
    }

    /**
     * get class from IOC container by identifier.
     *
     * @param {string} identifier
     * @param {ComponentType} [type="COMPONENT"]
     * @returns {Function}
     * @memberof Container
     */
    public getClass(identifier: string, type: ComponentType = "COMPONENT"): Function {
        //   const [,t] = identifier.match(/(\S+):/);
        // type = type || <ComponentType> t;
        return this.classMap.get(`${type}:${identifier}`);
    }

    /**
     * get instance from IOC container by class.
     *
     * @template T
     * @param {T} target
     * @param {any[]} [args=[]]
     * @returns {T}
     * @memberof Container
     */
    public getInsByClass<T>(target: T, args: any[] = []): T | undefined {
        if (!Check.isClass(target as IObjExt)) {
            return ;
        }
        // get instance from the Container
        const instance: any = this.instanceMap.get(target);
        // require Prototype instance
        if (args.length > 0) {
            // instantiation
            return Reflect.construct(<Function>(<unknown>target), args);
        } else {
            return instance;
        }
    }

    /**
     * get metadata from class
     *
     * @static
     * @param {(string | symbol)} metadataKey
     * @param {(Function | object)} target
     * @param {(string | symbol)} [propertyKey]
     * @returns
     * @memberof Injectable
     */
    public getMetadataMap(metadataKey: string | symbol, target: Function | Object, propertyKey?: string | symbol) {
        // filter Object.create(null)
        if (typeof target === "object" && target.constructor) {
            target = target.constructor;
        }
        if (!this.metadataMap.has(target)) {
            this.metadataMap.set(target, new Map());
        }
        if (propertyKey) {
            // for property or method
            const key = `${lodash.toString(metadataKey)}:${lodash.toString(propertyKey)}`;
            const map = this.metadataMap.get(target);
            if (!map.has(key)) {
                map.set(key, new Map());
            }
            return map.get(key);
        } else {
            // for class
            const map = this.metadataMap.get(target);
            if (!map.has(metadataKey)) {
                map.set(metadataKey, new Map());
            }
            return map.get(metadataKey);
        }
    }

    /**
     * get identifier from class
     *
     * @param {Function | Object} target
     * @returns
     * @memberof Container
     */
    public getIdentifier(target: Function | Object) {
        let name = "";
        if (lodash.isFunction(target)) {
            const metaData = Reflect.getOwnMetadata(TAGGED_CLS, target);
            if (metaData) {
                name = metaData.id ?? "";
            } else {
                name = (<Function>target).name ?? "";
            }
        } else {
            name = target.constructor ? target.constructor.name ?? "" : "";
        }
        return name;
    }

    /**
     * get component type from class
     *
     * @param {Function} target
     * @returns
     * @memberof Container
     */
    public getType(target: Function | Object) {
        const metaData = Reflect.getOwnMetadata(TAGGED_CLS, target);
        if (metaData) {
            return metaData.type;
        } else {
            // chechk base class name
            let name = (<Function>target).name ?? "";
            const baseType = Object.getPrototypeOf(target);
            const basename = baseType.constructor.name;
            name = name || (target.constructor ? target.constructor.name ?? "" : "");
            const reg = /(Addon|Capturer|Controller)/;
            if (!reg.test(name) && reg.test(basename)) {
                name = basename;
            }
            if (name.indexOf("Addon") > -1) {
                return "ADDON";
            } else if (name.indexOf("Capturer") > -1) {
                return "CAPTURER";
            } else if (name.indexOf("Controller") > -1) {
                return "CONTROLLER";
            } else {
                return "COMPONENT";
            }
        }
    }

    /**
     * save class to Container
     *
     * @param {ComponentType} type
     * @param {Function} module
     * @param {string} identifier
     * @memberof Container
     */
    public saveClass(type: ComponentType, module: Function, identifier: string) {
        Reflect.defineMetadata(TAGGED_CLS, { id: identifier, type }, module);
        const key = `${type}:${identifier}`;
        if (!this.classMap.has(key)) {
            this.classMap.set(key, module);
        }
    }

    /**
     * get all class from Container
     *
     * @param {ComponentType} type
     * @returns
     * @memberof Container
     */
    public listClass(type?: ComponentType) {
        type = type || <ComponentType>"";
        const modules: any[] = [];
        this.classMap.forEach((v, k) => {
            if (k.startsWith(type)) {
                modules.push({
                    id: k,
                    target: v
                });
            }
        });
        return modules;
    }

    public allClass() {
        const modules: any[] = [];
        this.classMap.forEach((v, k) => {
            modules.push({
                id: k,
                target: v
            });
        });
        return modules;
    }

    /**
     * save meta data to class or property
     *
     * @param {string} type
     * @param {(string | symbol)} decoratorNameKey
     * @param {*} data
     * @param {(Function | object)} target
     * @param {string} [propertyName]
     * @memberof Container
     */
    public saveClassMetadata(
        type: string | symbol,
        decoratorNameKey: string | symbol,
        data: any,
        target: Function | Object,
        propertyName?: string
    ) {
        if (propertyName) {
            const originMap = this.getMetadataMap(type, target, propertyName);
            originMap.set(decoratorNameKey, data);
        } else {
            const originMap = this.getMetadataMap(type, target);
            originMap.set(decoratorNameKey, data);
        }
    }

    // todo: usefull?
    public appendClassMeta(type: string, decoratorNameKey: string | symbol, data: any, target: Function | Object, propertyName?: string) {
        if (propertyName) {
            const originMap = this.getMetadataMap(type, target, propertyName);
            originMap.set(decoratorNameKey, data);
        } else {
            const originMap = this.getMetadataMap(type, target);
            originMap.set(decoratorNameKey, data);
        }
    }

    /**
     * attach data to class or property
     *
     * @param {string} type
     * @param {(string | symbol)} decoratorNameKey
     * @param {*} data
     * @param {(Function | object)} target
     * @param {string} [propertyName]
     * @memberof Container
     */
    public attachClassMetadata(
        type: string,
        decoratorNameKey: string | symbol,
        data: any,
        target: Function | Object,
        propertyName?: string
    ) {
        let originMap;
        if (propertyName) {
            originMap = this.getMetadataMap(type, target, propertyName);
        } else {
            originMap = this.getMetadataMap(type, target);
        }
        if (!originMap.has(decoratorNameKey)) {
            originMap.set(decoratorNameKey, []);
        }
        originMap.get(decoratorNameKey).push(data);
    }

    /**
     * get single data from class or property
     *
     * @param {string} type
     * @param {(string | symbol)} decoratorNameKey
     * @param {(Function | object)} target
     * @param {string} [propertyName]
     * @returns
     * @memberof Container
     */
    public getClassMetadata(type: string | symbol, decoratorNameKey: string | symbol, target: Function | Object, propertyName?: string) {
        if (propertyName) {
            const originMap = this.getMetadataMap(type, target, propertyName);
            return originMap.get(decoratorNameKey);
        } else {
            const originMap = this.getMetadataMap(type, target);
            return originMap.get(decoratorNameKey);
        }
    }

    /**
     * save property data to class
     *
     * @param {(string | symbol)} decoratorNameKey
     * @param {*} data
     * @param {(Function | object)} target
     * @param {(string | symbol)} propertyName
     * @memberof Container
     */
    public savePropertyData(decoratorNameKey: string | symbol, data: any, target: Function | Object, propertyName: string | symbol) {
        const originMap = this.getMetadataMap(decoratorNameKey, target);
        originMap.set(propertyName, data);
    }

    /**
     * attach property data to class
     *
     * @param {(string | symbol)} decoratorNameKey
     * @param {*} data
     * @param {(Function | object)} target
     * @param {(string | symbol)} propertyName
     * @memberof Container
     */
    public attachPropertyData(decoratorNameKey: string | symbol, data: any, target: Function | Object, propertyName: string | symbol) {
        const originMap = this.getMetadataMap(decoratorNameKey, target);
        if (!originMap.has(propertyName)) {
            originMap.set(propertyName, []);
        }
        originMap.get(propertyName).push(data);
    }

    /**
     * get property data from class
     *
     * @param {(string | symbol)} decoratorNameKey
     * @param {(Function | object)} target
     * @param {(string | symbol)} propertyName
     * @returns
     * @memberof Container
     */
    public getPropertyData(decoratorNameKey: string | symbol, target: Function | Object, propertyName: string | symbol) {
        const originMap = this.getMetadataMap(decoratorNameKey, target);
        return originMap.get(propertyName);
    }

    /**
     * list property data from class
     *
     * @param {(string | symbol)} decoratorNameKey
     * @param {(Function | object)} target
     * @returns
     * @memberof Container
     */
    public listPropertyData(decoratorNameKey: string | symbol, target: Function | Object) {
        const originMap = this.getMetadataMap(decoratorNameKey, target);
        const datas: any = {};
        for (const [key, value] of originMap) {
            datas[key] = value;
        }
        return datas;
    }
}

// export Singleton
export const IOCContainer: Container = Container.getInstance();
