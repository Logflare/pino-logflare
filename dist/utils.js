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
exports.formatPinoBrowserLogEvent = exports.toLogEntry = void 0;
var lodash_1 = __importDefault(require("lodash"));
function levelToStatus(level) {
    if (level === 10 || level === 20) {
        return "debug";
    }
    if (level === 40) {
        return "warning";
    }
    if (level === 50) {
        return "error";
    }
    if (level >= 60) {
        return "critical";
    }
    return "info";
}
var formatPinoBrowserLogEvent = function (logEvent) {
    var ts = logEvent.ts, messages = logEvent.messages, bindings = logEvent.bindings, levelValue = logEvent.level.value;
    var level = levelToStatus(levelValue);
    var timestamp = ts;
    var logEntry = messages.join(" ");
    var defaultMetadata = {
        url: window.document.URL,
        level: level
    };
    var metadata = lodash_1.default.reduce(bindings, function (acc, el) {
        return Object.assign(acc, el);
    }, defaultMetadata);
    return {
        metadata: metadata,
        log_entry: logEntry,
        timestamp: timestamp,
    };
};
exports.formatPinoBrowserLogEvent = formatPinoBrowserLogEvent;
function toLogEntry(item) {
    var status = levelToStatus(item.level);
    var message = item.msg || status;
    var host = item.hostname;
    var service = item.service;
    var pid = item.pid;
    var stack = item.stack;
    var type = item.type;
    var timestamp = item.time || new Date().getTime();
    var cleanedItem = lodash_1.default.omit(item, ["time", "level", "msg", "hostname", "service", "pid", "stack", "type"]);
    var context = lodash_1.default.pickBy({ host: host, service: service, pid: pid, stack: stack, type: type }, function (x) { return x; });
    return {
        metadata: __assign(__assign({}, cleanedItem), { context: context, level: status }),
        message: message,
        timestamp: timestamp,
    };
}
exports.toLogEntry = toLogEntry;
//# sourceMappingURL=utils.js.map