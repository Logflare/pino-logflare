"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var logflare_transport_core_1 = require("logflare-transport-core");
var streams = __importStar(require("./streams"));
var pumpify = require("pumpify");
function createWriteStream(options) {
    var _a = options.size, size = _a === void 0 ? 1 : _a;
    var parseJsonStream = streams.parseJsonStream();
    var toLogEntryStream = streams.toLogEntryStream();
    var batchStream = streams.batchStream(size);
    var writeStream = new logflare_transport_core_1.LogflareHttpClient(options).insertStream();
    return pumpify(parseJsonStream, toLogEntryStream, batchStream, writeStream);
}
exports.default = createWriteStream;
//# sourceMappingURL=httpStream.js.map