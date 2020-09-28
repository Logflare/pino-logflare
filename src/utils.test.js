import {formatPinoBrowserLogEvent, addLogflareTransformDirectives} from './utils'

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

  it("correctly logs metadata for string and object messages", async (done) => {
    const pinoBrowserLogEvent = {
      ts: 1593372837388,
      messages: [{c: 3}, "a message", "from pino logger", {b: 2}], bindings: [{a: 1}], level: {value: 30}
    }
    const formatted = formatPinoBrowserLogEvent(pinoBrowserLogEvent)

    expect(formatted).toEqual({
        metadata: {
          url: 'http://localhost/',
          level: 'info',
          a: 1,
          b: 2,
          c: 3,
          browser: true
        },
        log_entry: 'a message from pino logger',
        timestamp: 1593372837388
      }
    )
    done()
  })

  it("correctly adds logflare transform directives", async (done) => {
    const options = {
      transforms: {
        numbersToFloats: true
      }
    }
    const pinoBrowserLogEvent = {
      ts: 1593372837388,
      messages: ["a message", "from pino", "logger"],
      bindings: [{child1: "value1"}, {child2: "value2"}, {child3: "value3"}],
      level: {value: 30, label: "info"}
    }

    const formatted = formatPinoBrowserLogEvent(pinoBrowserLogEvent)
    const withTransforms = addLogflareTransformDirectives(formatted, options)

    expect(withTransforms).toEqual({
        metadata: {
          url: 'http://localhost/',
          level: 'info',
          child1: 'value1',
          child2: 'value2',
          child3: 'value3',
          browser: true
        },
        log_entry: 'a message from pino logger',
        timestamp: 1593372837388,
        "@logflareTransformDirectives": {
          numbersToFloats: true
        }
      }
    )
    done()
  })
})

