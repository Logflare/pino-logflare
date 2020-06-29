import {LogflareHttpClient} from "logflare-transport-core"
import * as streams from "./streams"
const pumpify = require("pumpify")

function createWriteStream(options: object = {}) {
  const {size = 1} = options

  const parseJsonStream = streams.parseJsonStream()
  const toLogEntryStream = streams.toLogEntryStream()
  const batchStream = streams.batchStream(size)

  const writeStream = new LogflareHttpClient(options).insertStream()

  return pumpify(
    parseJsonStream,
    toLogEntryStream,
    batchStream,
    writeStream
  )
}

export default createWriteStream
