"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createHttpWriteStream = exports.createConsoleWriteStream = exports.logflarePinoVercel = exports.createWriteStream = void 0;
var httpStream_1 = __importDefault(require("./httpStream"));
exports.createHttpWriteStream = httpStream_1.default;
var consoleStream_1 = __importDefault(require("./consoleStream"));
exports.createConsoleWriteStream = consoleStream_1.default;
var utils_1 = require("./utils");
var logflare_transport_core_1 = require("logflare-transport-core");
var isBrowser = typeof window !== 'undefined'
    && typeof window.document !== 'undefined';
var isNode = typeof process !== 'undefined'
    && process.versions != null
    && process.versions.node != null;
function createWriteStreamVercelAlt(options) {
    if (isNode) {
        return consoleStream_1.default(options);
    }
    if (isBrowser) {
        return httpStream_1.default(options);
    }
    throw ("Something went wrong: environment should be either browser or node");
}
var createPinoBrowserSend = function (options) {
    var client = new logflare_transport_core_1.LogflareHttpClient(options);
    return function (level, logEvent) {
        var logflareLogEvent = utils_1.formatPinoBrowserLogEvent(logEvent);
        client.postLogEvents([logflareLogEvent]);
    };
};
var logflarePinoVercel = function (options) {
    return {
        stream: consoleStream_1.default(options),
        send: createPinoBrowserSend(options),
    };
};
exports.logflarePinoVercel = logflarePinoVercel;
var createWriteStream = httpStream_1.default;
exports.createWriteStream = createWriteStream;
//# sourceMappingURL=index.js.map