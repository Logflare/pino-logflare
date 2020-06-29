"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.toLogEntryStream = exports.parseJsonStream = exports.batchStream = void 0;
var utils_1 = require("./utils");
var batch2_1 = __importDefault(require("batch2"));
var split2_1 = __importDefault(require("split2"));
var through2_1 = __importDefault(require("through2"));
var fast_json_parse_1 = __importDefault(require("fast-json-parse"));
function batchStream(size) {
    return batch2_1.default.obj({ size: size });
}
exports.batchStream = batchStream;
function parseJsonStream() {
    return split2_1.default(function (str) {
        var result = fast_json_parse_1.default(str);
        if (result.err)
            return;
        return result.value;
    });
}
exports.parseJsonStream = parseJsonStream;
function toLogEntryStream() {
    return through2_1.default.obj(function (chunk, enc, cb) {
        var entry = utils_1.toLogEntry(chunk);
        cb(null, entry);
    });
}
exports.toLogEntryStream = toLogEntryStream;
//# sourceMappingURL=streams.js.map