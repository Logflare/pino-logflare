'use strict'

const test = require('tap').test
const tested = require('../src/streams')

test('streams to batches', (t) => {
  const writeStream = tested.batchStream(10)
  writeStream.on('data', (chunk) => {
    t.equal(chunk.length, 10)
    if (chunk[0].id === 11) {
      t.end()
    }
  })
  for (let i = 1; i <= 20; i++) {
    writeStream.write({id: i, name: `item ${i}`})
  }
  writeStream.end()
})

test('streams valid json', (t) => {
  const writeStream = tested.parseJsonStream()
  writeStream.on('data', (chunk) => {
    t.deepEqual(chunk, {id: '1', name: 'item 1'})
    t.end()
  })
  writeStream.write('{ "id": "1", "name": "item 1" }')
  writeStream.end()
})

test('does not stream invalid json', (t) => {
  const writeStream = tested.parseJsonStream()
  writeStream
    .on('data', (chunk) => {
      t.fail('Should not be here')
    })
    .on('end', () => {
      t.end()
    })
  writeStream.write('{ this is not valid json }')
  writeStream.end()
})

test('transforms pino log messages', (t) => {
  const writeStream = tested.toLogEntryStream()
  const output = []
  const logs = [
    {
      level: 10,
      time: 1532081790710,
      msg: 'trace message',
      pid: 9118,
      hostname: 'Osmonds-MacBook-Pro.local',
      v: 1,
    },
    {
      level: 20,
      time: 1532081790720,
      msg: 'debug message',
      pid: 9118,
      hostname: 'Osmonds-MacBook-Pro.local',
      v: 1,
    },
    {
      level: 30,
      time: 1532081790730,
      msg: 'info message',
      pid: 9118,
      hostname: 'Osmonds-MacBook-Pro.local',
      v: 1,
    },
    {
      level: 40,
      time: 1532081790740,
      msg: 'warning message',
      pid: 9118,
      hostname: 'Osmonds-MacBook-Pro.local',
      v: 1,
    },
    {
      level: 50,
      time: 1532081790750,
      msg: 'error message',
      pid: 9118,
      hostname: 'Osmonds-MacBook-Pro.local',
      type: 'Error',
      stack: 'Error: error message',
      v: 1,
    },
    {
      level: 60,
      time: 1532081790760,
      msg: 'fatal message',
      pid: 9118,
      hostname: 'Osmonds-MacBook-Pro.local',
      v: 1,
    },
    {
      level: 30,
      pid: 9118,
      source: 'test',
      service: 'myservice',
      tags: {foo: 'bar'},
      v: 1,
    },
  ]
  writeStream
    .on('data', (chunk) => {
      output.push(chunk)
    })
    .on('end', () => {
      t.equal(output[0].metadata.level, 'debug')
      t.equal(output[1].metadata.level, 'debug')
      t.equal(output[2].metadata.level, 'info')
      t.equal(output[3].metadata.level, 'warning')
      t.equal(output[4].metadata.level, 'error')
      t.equal(output[5].metadata.level, 'critical')
      t.ok(Object.prototype.hasOwnProperty.call(output[6], 'timestamp'))
      t.equal(output[6].message, 'info')
      t.equal(output[6].metadata.context.host, '')
      t.end()
    })
  logs.forEach((log) => writeStream.write(log))
  writeStream.end()
})
