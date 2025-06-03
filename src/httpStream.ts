import { HttpClient, HttpClientOptions } from "logflare-transport-core"
import * as streams from "./streams"
import stream from "stream"
const pumpify = require("pumpify")

export interface PayloadMeta {
  cleanedPayload: Record<string, any>
  message?: string
  level?: string
  timestamp?: string
  context: {
    host?: string
    service?: string
    pid?: string
    stack?: string
    type?: string
  }
}
export type PreparePayloadCallback = (
  payload: Record<string, any>,
  meta: PayloadMeta,
) => Record<string, any>
export interface Options extends HttpClientOptions {
  size?: number
  onPreparePayload?: PreparePayloadCallback
}

function createWriteStream(options: Options) {
  const { size = 1 } = options

  const parseJsonStream = streams.parseJsonStream()
  const toLogEntryStream = streams.toLogEntryStream(options)
  const batchStream = streams.batchStream(size)
  const writeStream = createClientStream(new HttpClient(options))

  return pumpify(parseJsonStream, toLogEntryStream, batchStream, writeStream)
}

/**
 * create write stream around the http client
 * Logic moved from logflare transport core js
 * - https://github.com/atdrago/logflare-transport-core-js/commit/4aad9030aca1c9ea6c241d4e6ebfc0da76eaea8f
 * - https://github.com/Logflare/pino-logflare/issues/41
 */
function createClientStream(client: HttpClient) {
  const writeStream = new stream.Writable({
    objectMode: true,
    highWaterMark: 1,
  })
  writeStream._write = function (chunk, _encoding, callback) {
    client
      .postLogEvents(chunk)
      .then(() => {
        callback(null)
      })
      .catch(callback)
  }
  return writeStream
}

export default createWriteStream
