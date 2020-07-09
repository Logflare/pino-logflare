import {formatPinoBrowserLogEvent} from './utils'

describe("utils", () => {
  it("correctly formats pino browser log event", async (done) => {
    const pinoBrowserLogEvent = {
      ts: 1593372837388,
      messages: ["a message", "from pino", "logger"],
      bindings: [{child1: "value1"}, {child2: "value2"}, {child3: "value3"}],
      level: {value: 30, label: "info"}
    }

    const formatted = formatPinoBrowserLogEvent(pinoBrowserLogEvent)

    expect(formatted).toEqual({
        metadata: {
          url: 'http://localhost/',
          level: 'info',
          child1: 'value1',
          child2: 'value2',
          child3: 'value3',
          browser: true
        },
        log_entry: 'a message from pino logger',
        timestamp: 1593372837388
      }
    )
    done()
  })
})

