"use strict"

const {LogflareHttpClient} = require("logflare-transport-core")
const streams = require("./streams")
const pumpify = require("pumpify")

function createWriteStream(options = {}) {
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

module.exports.createWriteStream = createWriteStream
