'use strict'

const test = require('tap').test
const tested = require('../src/index')

test('creates write stream', t => {
  try {
    const writeStream = tested.createWriteStreamSync()
    t.ok(writeStream.writable)
    t.end()
  } catch (err) {
    t.fail(err.message)
    t.end()
  }
})

test('creates write stream "async"', t => {
  tested.createWriteStream().then(writeStream => {
    t.ok(writeStream.writable)
    t.end()
  }).catch(err => {
    t.fail(err.message)
    t.end()
  })
})
