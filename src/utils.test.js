import {
  formatPinoBrowserLogEvent,
  addLogflareTransformDirectives,
  toLogEntry,
} from "./utils"

describe("utils", () => {
  it("correctly formats pino browser log event", async (done) => {
    const pinoBrowserLogEvent = {
      ts: 1593372837388,
      messages: ["a message", "from pino", "logger"],
      bindings: [
        { child1: "value1" },
        { child2: "value2" },
        { child3: "value3" },
      ],
      level: { value: 30, label: "info" },
    }

    const formatted = formatPinoBrowserLogEvent(pinoBrowserLogEvent)

    expect(formatted).toEqual({
      metadata: {
        url: "http://localhost/",
        level: "info",
        child1: "value1",
        child2: "value2",
        child3: "value3",
        browser: true,
      },
      log_entry: "a message from pino logger",
      timestamp: 1593372837388,
    })
    done()
  })

  it("correctly logs metadata for string and object messages", async (done) => {
    const pinoBrowserLogEvent = {
      ts: 1593372837388,
      messages: [{ c: 3 }, "a message", "from pino logger", { b: 2 }],
      bindings: [{ a: 1 }],
      level: { value: 30 },
    }
    const formatted = formatPinoBrowserLogEvent(pinoBrowserLogEvent)

    expect(formatted).toEqual({
      metadata: {
        url: "http://localhost/",
        level: "info",
        a: 1,
        b: 2,
        c: 3,
        browser: true,
      },
      log_entry: "a message from pino logger",
      timestamp: 1593372837388,
    })
    done()
  })

  it("correctly adds logflare transform directives", async (done) => {
    const options = {
      transforms: {
        numbersToFloats: true,
      },
    }
    const pinoBrowserLogEvent = {
      ts: 1593372837388,
      messages: ["a message", "from pino", "logger"],
      bindings: [
        { child1: "value1" },
        { child2: "value2" },
        { child3: "value3" },
      ],
      level: { value: 30, label: "info" },
    }

    const formatted = formatPinoBrowserLogEvent(pinoBrowserLogEvent)
    const withTransforms = addLogflareTransformDirectives(formatted, options)

    expect(withTransforms).toEqual({
      metadata: {
        url: "http://localhost/",
        level: "info",
        child1: "value1",
        child2: "value2",
        child3: "value3",
        browser: true,
      },
      log_entry: "a message from pino logger",
      timestamp: 1593372837388,
      "@logflareTransformDirectives": {
        numbersToFloats: true,
      },
    })
    done()
  })

  describe("toLogEntry", () => {
    it("correctly cleans the passed item before adding its properties to metadata", () => {
      const item = {
        time: 1532081790750,
        level: 50,
        msg: "a message",
        hostname: "Osmonds-MacBook-Pro.local",
        service: "a service",
        pid: 1234,
        stack: "Error: error message",
        type: "Error",
        v: 1,
      }

      const logEntry = toLogEntry(item)

      expect(logEntry).toMatchObject({
        metadata: {
          v: 1,
          context: {
            host: item.hostname,
            service: item.service,
            pid: item.pid,
            stack: item.stack,
            type: item.type,
          },
          level: "error",
        },
        message: item.msg,
        timestamp: item.time,
      })
    })

    it("correctly removes falsy items before adding them to context", () => {
      const item = {
        time: 1532081790750,
        level: 50,
        msg: "a message",
        hostname: false,
        service: null,
        pid: 0,
        stack: "",
        type: undefined,
        v: 1,
      }

      const logEntry = toLogEntry(item)

      expect(logEntry).toMatchObject({
        metadata: {
          v: 1,
          context: {},
          level: "error",
        },
        message: item.msg,
        timestamp: item.time,
      })
    })
  })
})
