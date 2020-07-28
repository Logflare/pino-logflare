import _ from "lodash"
import {isObject, isString} from "lodash"

function levelToStatus(level: number) {
  if (level === 10 || level === 20) {
    return "debug"
  }
  if (level === 40) {
    return "warning"
  }
  if (level === 50) {
    return "error"
  }
  if (level >= 60) {
    return "critical"
  }
  return "info"
}

interface pinoBrowserLogEventI {
  ts: number,
  messages: string[],
  bindings: object[],
  level: { value: number, label: string }
}

const formatPinoBrowserLogEvent = (logEvent: pinoBrowserLogEventI) => {
  const { ts, messages, bindings, level: { value: levelValue } } = logEvent
  const level = levelToStatus(levelValue)
  const timestamp = ts
  const objMessages = _.filter(messages, isObject)
  const strMessages = _.filter(messages, isString)
  const logEntry = strMessages.join(" ")
  const defaultMetadata = {
    url: window.document.URL,
    level: level,
    browser: true
  }
  const bindingsAndMessages = bindings.concat(objMessages)
  const metadata = _.reduce(bindingsAndMessages, (acc, el) => {
    return Object.assign(acc, el)
  }, defaultMetadata)

  return {
    metadata,
    log_entry: logEntry,
    timestamp,
  }
}

function toLogEntry(item: Record<string, any>) {
  const status = levelToStatus(item.level)
  const message = item.msg || status
  const host = item.hostname
  const service = item.service
  const pid = item.pid
  const stack = item.stack
  const type = item.type
  const timestamp = item.time || new Date().getTime()

  const cleanedItem = _.omit(item, ["time", "level", "msg", "hostname", "service", "pid", "stack", "type"])
  const context = _.pickBy({ host, service, pid, stack, type }, x => x)
  return {
    metadata: {
      ...cleanedItem,
      context,
      level: status,
    },
    message,
    timestamp,
  }
}

export { toLogEntry, formatPinoBrowserLogEvent, pinoBrowserLogEventI }
