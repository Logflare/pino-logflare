/// <reference types="node" />
import createHttpWriteStream from "./httpStream";
import createConsoleWriteStream from "./consoleStream";
import { pinoBrowserLogEventI } from "./utils";
import { LogflareUserOptionsI } from "logflare-transport-core";
import stream from "stream";
declare const logflarePinoVercel: (options: LogflareUserOptionsI) => {
    stream: stream.Writable;
    send: (level: number, logEvent: pinoBrowserLogEventI) => void;
};
declare const createWriteStream: typeof createHttpWriteStream;
export { createWriteStream, logflarePinoVercel, createConsoleWriteStream, createHttpWriteStream };
