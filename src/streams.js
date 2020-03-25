"use strict"

const batch2 = require("batch2")
const split2 = require("split2")
const through2 = require("through2")
const fastJsonParse = require("fast-json-parse")
const _ = require("lodash")

function batchStream(size) {
  return batch2.obj({size})
}

function parseJsonStream() {
  return split2(function (str) {
    const result = fastJsonParse(str)
    if (result.err) return
    return result.value
  })
}

function levelToStatus(level) {
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

function toLogEntry(item) {
  const timestamp = item.time || new Date().getTime()
  const status = levelToStatus(item.level)
  const message = item.msg || status
  const host = item.hostname || ""
  const service = item.service || ""
  const pid = item.pid
  const v = item.v
  const stack = item.stack || ""
  const type = item.type || ""

  const cleanedItem = _.omit(item, ["time", "level", "msg", "hostname", "service", "pid", "v", "stack", "type"])
  return {
    metadata: {
      ...cleanedItem,
      context: {
        host,
        service,
        pid,
        v,
        stack,
        type
      },
      level: status,
    },
    message,
    timestamp,
  }
}

function toLogEntryStream(options) {
  return through2.obj(function transport(chunk, enc, cb) {
    const entry = toLogEntry(chunk)
    cb(null, entry)
  })
}

module.exports = {
  batchStream,
  parseJsonStream,
  toLogEntryStream
}
