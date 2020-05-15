'use strict'

const test = require('tap').test
const tested = require('../src/index')

test('creates write stream', (t) => {
  try {
    const writeStream = tested.createWriteStream({
      apiBaseUrl: "http://localhost:4000/",
      apiKey: "test-key",
      sourceToken: "test-token",
    })
    t.ok(writeStream.writable)
    t.end()
  } catch (err) {
    t.fail(err.message)
    t.end()
  }
})

