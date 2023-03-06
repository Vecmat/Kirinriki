/**
 * @ Author: Hanrea
 * @ version: 2022-03-21 13:14:21
 * @ copyright: Vecmat (c) - <hi(at)vecmat.com>
 */
import Koa from "koa";
import { WebSocket } from "ws";
import { Context } from "../container";
import { ServerDuplexStream, ServerReadableStream, ServerUnaryCall, ServerWritableStream } from "@grpc/grpc-js";
import { sendUnaryData, ServerUnaryCallImpl } from "@grpc/grpc-js/build/src/server-call";
import { MetadataClass } from "./Metadata";
import { IncomingMessage } from "http";

// KoaContext
export type KoaContext = Koa.BaseContext & Koa.DefaultContext;
/**
 * INext
 */
export type INext = Koa.Next;
/**
 * WsRequest
 *
 * @class WsRequest
 * @extends {IncomingMessage}
 */
export class WsRequest extends IncomingMessage {
    data: Buffer | ArrayBuffer | Buffer[];
}

// export
export type IRpcServerUnaryCall<RequestType, ResponseType> = ServerUnaryCall<RequestType, ResponseType>;
export type IRpcServerReadableStream<RequestType, ResponseType> = ServerReadableStream<RequestType, ResponseType>;
export type IRpcServerWriteableStream<RequestType, ResponseType> = ServerWritableStream<RequestType, ResponseType>;
export type IRpcServerDuplexStream<RequestType, ResponseType> = ServerDuplexStream<RequestType, ResponseType>;

// redefine ServerCall
export type IRpcServerCall<RequestType, ResponseType> =
    | IRpcServerUnaryCall<RequestType, ResponseType>
    | IRpcServerReadableStream<RequestType, ResponseType>
    | IRpcServerWriteableStream<RequestType, ResponseType>
    | IRpcServerDuplexStream<RequestType, ResponseType>;
// redefine ServerCallImpl
export type IRpcServerCallImpl<RequestType, ResponseType> = ServerUnaryCallImpl<RequestType, ResponseType>;

// redefine ServerCallback
export type IRpcServerCallback<ResponseType> = sendUnaryData<ResponseType>;

// redefine WebSocket
export type IWebSocket = WebSocket;

/**
 * AppContext
 */
type AppContext = Koa.Context & Context;

/**
 * Kirinriki Context.
 *
 * @export
 * @interface IContext
 * @extends {Koa.Context}
 */
export interface IContext extends AppContext {
    /**
     * state
     *
     * @type {Koa.DefaultState}
     * @memberof IContext
     */
    state: any;

    /**
     * status
     *
     * @type {number}
     * @memberof IContext
     */
    status: number;

    /**
     * metadata
     *
     * @type {MetadataClass}
     * @memberof IContext
     */
    metadata: MetadataClass;

    /**
     * protocol
     *
     * @type {string}
     * @memberof IContext
     */
    protocol: string;

    /**
     * gRPC ServerImpl
     *
     * @type {{
     *         call: IRpcServerCall<any, any>;
     *         callback?: IRpcServerCallback<any>;
     *     }}
     * @memberof IContext
     */
    rpc?: {
        call: IRpcServerCall<any, any>;
        callback?: IRpcServerCallback<any>;
    };

    /**
     * websocket instance
     *
     * @type {*}
     * @memberof IContext
     */
    websocket?: IWebSocket; // ws.WebSocket

    /**
     * send metadata to http request header.
     * then gRPC request to send metadata
     *
     * @memberof IContext
     */
    sendMetadata?: (data: MetadataClass) => void;

    /**
     * Replace ctx.throw
     *
     * @type {(status: number, message?: string)}
     * @type {(message: string, code?: number, status?: HttpStatusCode)}
     * @memberof Context
     */
    throw(status: number, message?: string): never;
    throw(message: string, code?: number, status?: any): never;
    /**
     * context metadata
     *
     * @memberof Context
     */
    getMetaData: (key: string) => unknown;
    setMetaData: (key: string, value: any) => any;
}
