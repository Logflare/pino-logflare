/// <reference types="node" />
import createHttpWriteStream from "./httpStream";
import createConsoleWriteStream from "./consoleStream";
import { pinoBrowserLogEventI } from "./utils";
declare const logflarePinoVercel: (options: object) => {
    stream: import("stream").Writable;
    send: (level: number, logEvent: pinoBrowserLogEventI) => void;
};
declare const createWriteStream: typeof createHttpWriteStream;
export { createWriteStream, logflarePinoVercel, createConsoleWriteStream, createHttpWriteStream };
