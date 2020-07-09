import createHttpWriteStream from "./httpStream"
import createConsoleWriteStream from "./consoleStream"
import { pinoBrowserLogEventI, formatPinoBrowserLogEvent } from "./utils"
import { LogflareHttpClient, LogflareUserOptionsI } from "logflare-transport-core"

const isBrowser = typeof window !== 'undefined'
  && typeof window.document !== 'undefined'

const isNode = typeof process !== 'undefined'
  && process.versions != null
  && process.versions.node != null

const createPinoBrowserSend = (options: LogflareUserOptionsI) => {
  const client = new LogflareHttpClient({ ...options, fromBrowser: true })

  return (level: number, logEvent: pinoBrowserLogEventI) => {
    const logflareLogEvent = formatPinoBrowserLogEvent(logEvent)
    client.postLogEvents([logflareLogEvent])
  }
}

const logflarePinoVercel = (options: LogflareUserOptionsI) => {
  return {
    stream: createConsoleWriteStream(options),
    send: createPinoBrowserSend(options),
  }
}

const createWriteStream = createHttpWriteStream

export { createWriteStream, logflarePinoVercel, createPinoBrowserSend, createConsoleWriteStream, createHttpWriteStream }
