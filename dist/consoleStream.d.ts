/// <reference types="node" />
import stream from "stream";
import { LogflareUserOptionsI } from "logflare-transport-core";
declare const createConsoleWriteStream: (options: LogflareUserOptionsI) => stream.Writable;
export default createConsoleWriteStream;
