import {batchStream, parseJsonStream, toLogEntryStream} from './streams'

describe("streams", () => {
  it('streams to batches', (done) => {
    const writeStream = batchStream(10)
    writeStream.on('data', (chunk) => {
      expect(chunk.length).toEqual(10)
    })
    for (let i = 1; i <= 20; i++) {
      writeStream.write({id: i, name: `item ${i}`})
    }
    writeStream.end()
    done()
  })

  it('streams valid json', (done) => {
    const writeStream = parseJsonStream()
    writeStream.on('data', (chunk) => {
      expect(chunk).toEqual({id: '1', name: 'item 1'})
    })
    writeStream.write('{ "id": "1", "name": "item 1" }')
    writeStream.end()
    done()
  })

  it('does not stream invalid json', (done) => {
    const writeStream = parseJsonStream()
    writeStream
      .on('data', (chunk) => {
        t.fail('Should not be here')
      })
      .on('end', () => {
      })
    writeStream.write('{ this is not valid json }')
    writeStream.end()
    done()
  })

  it('transforms pino log messages', (done) => {
    const writeStream = toLogEntryStream()
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
        expect(output[0].metadata.level).toEqual('debug')
        expect(output[1].metadata.level).toEqual('debug')
        expect(output[2].metadata.level).toEqual('info')
        expect(output[3].metadata.level).toEqual('warning')
        expect(output[4].metadata.level).toEqual('error')
        expect(output[5].metadata.level).toEqual('critical')
        expect(Object.prototype.hasOwnProperty.call(output[6], 'timestamp')).toBe(true)
        expect(output[6].message).toEqual('info')
        expect(output[6].metadata.context.host).toBe(undefined)
      })
    logs.forEach((log) => writeStream.write(log))
    writeStream.end()
    done()
  })
})
