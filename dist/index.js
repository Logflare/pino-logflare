"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createHttpWriteStream = exports.createConsoleWriteStream = exports.createPinoBrowserSend = exports.logflarePinoVercel = exports.createWriteStream = void 0;
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
var createPinoBrowserSend = function (options) {
    var client = new logflare_transport_core_1.LogflareHttpClient(__assign(__assign({}, options), { fromBrowser: true }));
    return function (level, logEvent) {
        var logflareLogEvent = utils_1.formatPinoBrowserLogEvent(logEvent);
        client.postLogEvents([logflareLogEvent]);
    };
};
exports.createPinoBrowserSend = createPinoBrowserSend;
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