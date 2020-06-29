import {toLogEntry} from "./utils"
import _ from "lodash"
import stream from "stream"
import fastJsonParse from "fast-json-parse"

const createConsoleWriteStream = (options: object) => {
  const writeStream = new stream.Writable({
    objectMode: true,
    highWaterMark: 1,
  })

  writeStream._write = (chunk, encoding, callback) => {
    const batch = Array.isArray(chunk) ? chunk : [chunk]
    _(batch)
      .map(JSON.parse)
      .map(toLogEntry)
      .map(JSON.stringify)
      .forEach(console.log)
    callback()
  }
  return writeStream
}

export default createConsoleWriteStream
