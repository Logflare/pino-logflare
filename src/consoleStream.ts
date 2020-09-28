import {toLogEntry} from "./utils"
import _ from "lodash"
import stream from "stream"
import {LogflareUserOptionsI} from "logflare-transport-core"
import {addLogflareTransformDirectives} from "./utils"

const createConsoleWriteStream = (options: LogflareUserOptionsI) => {
  const writeStream = new stream.Writable({
    objectMode: true,
    highWaterMark: 1,
  })

  writeStream._write = (chunk, encoding, callback) => {
    const batch = Array.isArray(chunk) ? chunk : [chunk]
    _(batch)
      .map(JSON.parse)
      .map(toLogEntry)
      .map((logEntry: Record<string, any>) => addLogflareTransformDirectives(logEntry, options))
      .map(JSON.stringify)
      .forEach((x) => {
        process.stdout.write(x + '\n')
      })

    callback()
  }
  return writeStream
}

export default createConsoleWriteStream
