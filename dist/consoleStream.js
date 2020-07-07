"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var utils_1 = require("./utils");
var lodash_1 = __importDefault(require("lodash"));
var stream_1 = __importDefault(require("stream"));
var createConsoleWriteStream = function (options) {
    var writeStream = new stream_1.default.Writable({
        objectMode: true,
        highWaterMark: 1,
    });
    writeStream._write = function (chunk, encoding, callback) {
        var batch = Array.isArray(chunk) ? chunk : [chunk];
        lodash_1.default(batch)
            .map(JSON.parse)
            .map(utils_1.toLogEntry)
            .map(JSON.stringify)
            .forEach(function (x) {
            process.stdout.write(x + '\n');
        });
        callback();
    };
    return writeStream;
};
exports.default = createConsoleWriteStream;
//# sourceMappingURL=consoleStream.js.map