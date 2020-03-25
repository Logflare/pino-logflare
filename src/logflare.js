"use strict"

const axios = require("axios").default
const stream = require("stream")
const defaultApiUrl = `https://api.logflare.app/logs`


class Client {
  constructor(options = {}) {
    this._options = options
  }

  async insert(items = []) {
    const logs = Array.isArray(items) ? items : [items]
    if (logs.length <= 0) {
      return
    }
    try {
      const url = this._options.apiUrl || defaultApiUrl
      const headers = {
        "Content-Type": "application/json",
        "X-API-KEY": this._options.apiKey,
      }
      const data = {
        source: this._options.source,
        batch: logs,
      }
      const result = await axios.post(url, data, {headers})
      return result
    } catch (err) {
      console.error("The previous log(s) were not saved")
      console.error(`${err.message}\n${err.stack}`)
    }
  }

  insertStream() {
    const self = this
    const writeStream = new stream.Writable({
      objectMode: true,
      highWaterMark: 1,
    })
    writeStream._write = function (chunk, encoding, callback) {
      self
        .insert(chunk)
        .then(() => {
          callback(null)
        })
        .catch(callback)
    }
    return writeStream
  }
}

module.exports = {Client}
