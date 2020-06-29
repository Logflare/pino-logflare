"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
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
    var apiKey = options.apiKey, sourceToken = options.sourceToken;
    var postRequest = function (lfRequestBody) { return __awaiter(void 0, void 0, void 0, function () {
        var logflareApiURL, body, request;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    logflareApiURL = "https://api.logflare.app/logs?api_key=" + apiKey + "&source=" + sourceToken;
                    body = JSON.stringify(lfRequestBody);
                    request = {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: body,
                    };
                    return [4 /*yield*/, fetch(logflareApiURL, request)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); };
    return function (level, logEvent) {
        var logflareLogEvent = utils_1.formatPinoBrowserLogEvent(logEvent);
        postRequest(logflareLogEvent);
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