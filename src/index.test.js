import pinoLogflare, { logflarePinoVercel, createWriteStream } from "./index"
import pino from "pino"
import Pumpify from "pumpify"
import { mockProcessStdout } from "jest-mock-process"
import os from "os"
import { Transform } from "stream"

describe("pinoLogflare", () => {
  it("is a Transform stream", async () => {
    const stream = await pinoLogflare({
      apiKey: "testApiKey",
      sourceToken: "testSourceToken",
    })
    expect(stream).toBeInstanceOf(Transform)
  })
})

describe("main", () => {
  it("logflarePinoVercel creates correct stream and transmit objects", async () => {
    const { stream, send } = logflarePinoVercel({
      apiKey: "testApiKey",
      sourceToken: "testSourceToken",
    })

    expect(stream.write).toBeInstanceOf(Function)
    expect(send).toBeInstanceOf(Function)
  })

  it("creates a writable http stream", async () => {
    const writeStream = createWriteStream({
      apiBaseUrl: "http://localhost:4000/",
      apiKey: "test-key",
      sourceToken: "test-token",
    })
    expect(writeStream).toBeInstanceOf(Pumpify)
  })
})

describe("main", () => {
  let mockStdout

  beforeEach(() => {
    mockStdout = mockProcessStdout()
  })

  it("correctly logs metadata for logger", async () => {
    const { stream, send } = logflarePinoVercel({
      apiKey: "testApiKey",
      sourceToken: "testSourceToken",
    })

    const logger = pino({}, stream)

    logger.info(
      { structuredData: "value1", nestedStructed: { field: "value2" } },
      "comment",
    )

    const [[mockCall]] = mockStdout.mock.calls
    const payload = JSON.parse(mockCall)

    expect(payload).toMatchObject({
      metadata: {
        structuredData: "value1",
        nestedStructed: { field: "value2" },
        context: { host: os.hostname(), pid: process.pid },
        level: "info",
      },
      message: "comment",
    })
  })

  it("createWriteStream correctly calls onError callbacks", async () => {
    const mockFn = jest.fn()
    const stream = createWriteStream({
      apiKey: "testApiKey",
      sourceToken: "testSourceToken",
      onError: mockFn,
    })

    global.fetch = jest.fn().mockImplementation(async () => {
      throw new Error("some error")
    })
    const logger = pino({}, stream)
    await logger.info({ some: "value" }, "should error")

    expect(global.fetch).toBeCalledTimes(1)
    expect(mockFn).toBeCalledTimes(1)
  })

  it("createWriteStream can customize payload using callback", async () => {
    const mockFn = jest.fn().mockImplementation((item, meta) => {
      return { some: "overwritten" }
    })
    const stream = createWriteStream({
      apiKey: "testApiKey",
      sourceToken: "testSourceToken",
      onPreparePayload: mockFn,
    })

    global.fetch = jest.fn()
    const logger = pino({}, stream)
    await logger.info({ some: "value" }, "should error")

    expect(global.fetch).toBeCalledTimes(1)
    expect(mockFn).toBeCalledTimes(1)

    const body = global.fetch.mock.calls[0][1]["body"]
    const decoded = JSON.parse(body)
    expect(decoded["batch"][0]).toStrictEqual({ some: "overwritten" })
  })

  it("correctly logs metadata for child loggers", async () => {
    const { stream, send } = logflarePinoVercel({
      apiKey: "testApiKey",
      sourceToken: "testSourceToken",
    })

    const logger = pino({}, stream)

    const childLogger = logger.child({ child1: true })

    childLogger.info(
      { structuredData: "value1", nestedStructed: { field: "value2" } },
      "comment",
    )

    const [[mockCall]] = mockStdout.mock.calls
    const payload = JSON.parse(mockCall)

    expect(payload).toMatchObject({
      metadata: {
        structuredData: "value1",
        child1: true,
        nestedStructed: { field: "value2" },
        context: { host: os.hostname(), pid: process.pid },
        level: "info",
      },
      message: "comment",
    })
  })
})
