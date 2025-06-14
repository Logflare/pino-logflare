import { handlePreparePayload } from "./utils"
import batch2 from "batch2"
import split2 from "split2"
import through2 from "through2"
import fastJsonParse from "fast-json-parse"
import { Options } from "./httpStream"

function batchStream(size: number) {
  return batch2.obj({ size })
}

function parseJsonStream() {
  return split2((str) => {
    const result = fastJsonParse(str)
    if (result.err) return
    return result.value
  })
}

function toLogEntryStream(options: Options) {
  return through2.obj((chunk, enc, cb) => {
    const entry = handlePreparePayload(chunk, options)
    cb(null, entry)
  })
}

export { batchStream, parseJsonStream, toLogEntryStream }
