/// <reference types="node" />
import stream from "stream";
declare const createConsoleWriteStream: (options: object) => stream.Writable;
export default createConsoleWriteStream;
