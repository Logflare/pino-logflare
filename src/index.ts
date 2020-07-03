import createHttpWriteStream from "./httpStream"
import createConsoleWriteStream from "./consoleStream"
import {pinoBrowserLogEventI, formatPinoBrowserLogEvent, toLogEntry} from "./utils"
import {doTypecasting, LogflareHttpClient, LogflareUserOptionsI} from "logflare-transport-core"
import stream from "stream"
import _ from "lodash"

const isBrowser = typeof window !== 'undefined'
  && typeof window.document !== 'undefined'

const isNode = typeof process !== 'undefined'
  && process.versions != null
  && process.versions.node != null

function createWriteStreamVercelAlt(options: LogflareUserOptionsI) {
  if (isNode) {
    return createConsoleWriteStream(options)
  }
  if (isBrowser) {
    return createHttpWriteStream(options)
  }
  throw("Something went wrong: environment should be either browser or node")
}

const createPinoBrowserSend = (options: LogflareUserOptionsI) => {
  const client = new LogflareHttpClient(options)

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

export {createWriteStream, logflarePinoVercel, createConsoleWriteStream, createHttpWriteStream}
