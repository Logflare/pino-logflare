import createHttpWriteStream from "./httpStream"
import createConsoleWriteStream from "./consoleStream"
import {pinoBrowserLogEventI, formatPinoBrowserLogEvent} from "./utils"

const isBrowser = typeof window !== 'undefined'
  && typeof window.document !== 'undefined'

const isNode = typeof process !== 'undefined'
  && process.versions != null
  && process.versions.node != null;

function createWriteStreamVercelAlt(options: object) {
  if (isNode) {
    return createConsoleWriteStream(options)
  }
  if (isBrowser) {
    return createHttpWriteStream(options)
  }
  throw("Something went wrong: environment should be either browser or node")
}

const createPinoBrowserSend = (options: object) => {
  const {apiKey, sourceToken} = options

  const postRequest = async (lfRequestBody: object) => {
    const logflareApiURL = `https://api.logflare.app/logs?api_key=${apiKey}&source=${sourceToken}`

    const body = JSON.stringify(lfRequestBody)
    const request = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body,
    }

    await fetch(logflareApiURL, request)
  }

  return (level: number, logEvent: pinoBrowserLogEventI) => {
    const logflareLogEvent = formatPinoBrowserLogEvent(logEvent)
    postRequest(logflareLogEvent)
  }
}

const logflarePinoVercel = (options: object) => {
  return {
    stream: createConsoleWriteStream(options),
    send: createPinoBrowserSend(options),
  }
}

const createWriteStream = createHttpWriteStream

export {createWriteStream, logflarePinoVercel, createConsoleWriteStream, createHttpWriteStream}
