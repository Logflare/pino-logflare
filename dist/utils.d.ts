import _ from "lodash";
interface pinoBrowserLogEventI {
    ts: number;
    messages: string[];
    bindings: object[];
    level: {
        value: number;
        label: string;
    };
}
declare const formatPinoBrowserLogEvent: (logEvent: pinoBrowserLogEventI) => {
    metadata: {
        url: string;
        level: string;
        browser: boolean;
    };
    log_entry: string[];
    timestamp: number;
};
declare function toLogEntry(item: object): {
    metadata: {
        context: _.Dictionary<any>;
        level: string;
    };
    message: any;
    timestamp: any;
};
export { toLogEntry, formatPinoBrowserLogEvent, pinoBrowserLogEventI };
