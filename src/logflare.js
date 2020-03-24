"use strict";

const axios = require("axios");
const stream = require("stream");

class Client {
  constructor(options = {}) {
    this._options = options;
  }

  async insert(items = []) {
    const data = Array.isArray(items) ? items : [items];
    if (data.length <= 0) {
      return;
    }
    try {
      const url = `https://api.logflare.app/logs/`;
      const headers = {
        "Content-Type": "application/json",
        "X-API-KEY": this._options.apiKey
      };
      const result = await axios.post(url, data, headers);
      return result;
    } catch (err) {
      console.error("The previous log(s) were not saved");
      console.error(`${err.message}\n${err.stack}`);
    }
  }

  insertStream() {
    const self = this;
    const writeStream = new stream.Writable({
      objectMode: true,
      highWaterMark: 1
    });
    writeStream._write = function(chunk, encoding, callback) {
      self
        .insert(chunk)
        .then(() => {
          callback(null);
        })
        .catch(callback);
    };
    return writeStream;
  }
}

module.exports = { Client };
