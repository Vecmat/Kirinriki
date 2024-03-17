/**
 * @ Author: Hanrea
 * @ version: 2022-03-21 13:14:21
 * @ copyright: Vecmat (c) - <hi(at)vecmat.com>
 */
import lodash from "lodash";
import { Disk } from "@vecmat/vendor";
import { loadSync, Options, ProtobufTypeDefinition } from "@grpc/proto-loader";
import { GrpcObject, loadPackageDefinition, ServiceDefinition } from "@grpc/grpc-js";

/**
 *
 *
 * @export
 * @interface ProtoDef
 */
export interface ProtoDef {
    name: string;
    service: ServiceDefinition;
    handlers: ProtoDefHandler[];
}

export interface ProtoDefHandler {
    name: string;
    path: string;
    fn?: Function;
}

/**
 * LoadProto
 *
 * @export
 * @param {string} protoFile
 * @returns {*}
 */
export function LoadProto(
    protoFile: string,
    options: Options = {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true
    }
): GrpcObject {
    if (!Disk.isFile(protoFile)) throw new Error(`no such file: ${protoFile}`);

    // Loading file
    const parsedObj = loadSync(protoFile, options);
    return loadPackageDefinition(parsedObj);
}

/**
 * ListServices
 *
 * @export
 * @param {*} def
 * @returns {*}  {*}
 */
export function ListServices(def: GrpcObject | ProtobufTypeDefinition): ProtoDef[] {
    const results: ProtoDef[] = [];
    for (const [propName, value] of Object.entries(def)) {
        if (value) {
            if (typeof value === "function" && value.hasOwnProperty("service")) {
                const service = value.service;
                const handlers = [];
                for (const key in service) {
                    if (Object.hasOwnProperty.call(service, key)) {
                        const element = service[key];
                        handlers.push({
                            name: key,
                            path: element.path
                        });
                    }
                }
                results.push({
                    name: propName,
                    service,
                    handlers
                });
            } else if (lodash.isObject(value)) {
                results.push(...ListServices(value as GrpcObject));
            }
        }
    }
    return results;
}
