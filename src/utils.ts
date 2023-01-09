import { LogflareUserOptionsI } from "logflare-transport-core"

function isObject(value?: unknown): value is object {
  return typeof value === "object" && value !== null
}

function isString(value?: unknown): value is string {
  return typeof value === "string"
}

/**
 * Takes an object and removes all falsy properties
 */
function removeFalsy<TInput>(input: TInput): TInput {
  if (input === null || input === undefined) {
    return input
  }

  if (typeof input === "object" && input !== null) {
    let key: keyof typeof input

    for (key in input) {
      const value = input[key]

      if (!value) {
        delete input[key]
      } else if (typeof value === "object") {
        removeFalsy(value)

        if (!Object.keys(value).length) {
          delete input[key]
        }
      }
    }
  }

  return input
}

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

type Level = "fatal" | "error" | "warn" | "info" | "debug" | "trace"
type SerializerFn = (value: any) => any

interface Bindings {
  level?: Level | string
  serializers?: { [key: string]: SerializerFn }
  [key: string]: any
}

interface LogEvent {
  ts: number
  messages: any[]
  bindings: Bindings[]
  level: {
    label: string
    value: number
  }
}

const formatPinoBrowserLogEvent = (logEvent: LogEvent) => {
  const {
    ts,
    messages,
    bindings,
    level: { value: levelValue },
  } = logEvent
  const level = levelToStatus(levelValue)
  const timestamp = ts
  const objMessages = messages.filter(isObject)
  const strMessages = messages.filter(isString)
  const logEntry = strMessages.join(" ")
  const defaultMetadata = {
    url: getDocumentUrl(),
    level: level,
    browser: true,
  }
  const bindingsAndMessages = bindings.concat(objMessages)
  const metadata = bindingsAndMessages.reduce((acc, el) => {
    return Object.assign(acc, el)
  }, defaultMetadata)

  return {
    metadata,
    log_entry: logEntry,
    timestamp,
  }
}

function getDocumentUrl():string | undefined {
  if (typeof window !== 'undefined' && typeof window.document !== 'undefined') {
    return window.document.URL 
  }
}

function addLogflareTransformDirectives(
  item: Record<string, any>,
  options: LogflareUserOptionsI
): Record<string, any> {
  if (options?.transforms?.numbersToFloats) {
    return {
      ...item,
      "@logflareTransformDirectives": { numbersToFloats: true },
    }
  } else {
    return item
  }
}

function toLogEntry(item: Record<string, any>): Record<string, any> {
  const status = levelToStatus(item.level)
  const message = item.msg || status
  const host = item.hostname
  const service = item.service
  const pid = item.pid
  const stack = item.stack
  const type = item.type
  const timestamp = item.time || new Date().getTime()

  const {
    time: _time,
    level: _level,
    msg: _msg,
    hostname: _hostname,
    service: _service,
    pid: _pid,
    stack: _stack,
    type: _type,
    ...cleanedItem
  } = item
  const context = removeFalsy({ host, service, pid, stack, type })
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

export {
  toLogEntry,
  formatPinoBrowserLogEvent,
  Level,
  LogEvent,
  addLogflareTransformDirectives,
}
