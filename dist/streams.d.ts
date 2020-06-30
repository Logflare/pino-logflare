/// <reference types="node" />
declare function batchStream(size: number): any;
declare function parseJsonStream(): import("stream").Transform;
declare function toLogEntryStream(): import("stream").Transform;
export { batchStream, parseJsonStream, toLogEntryStream, };
