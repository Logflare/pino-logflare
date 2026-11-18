import pinoLogflare, {
  createBatchInstance,
  logflarePinoVercel,
  createWriteStream,
} from "./index"
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
    const { stream } = logflarePinoVercel({
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
    const mockFn = jest.fn().mockImplementation(() => {
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
    const { stream } = logflarePinoVercel({
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

describe("batch instance", () => {
  let mockClient
  let batchInstance

  beforeEach(() => {
    mockClient = {
      postLogEvents: jest.fn().mockResolvedValue(undefined),
    }
    batchInstance = createBatchInstance(
      {
        batchSize: 2,
        batchTimeout: 100,
      },
      mockClient,
    )
  })

  it("sends batch when size limit is reached", async () => {
    await batchInstance.addEvent({ msg: "test1" })
    await batchInstance.addEvent({ msg: "test2" })

    expect(mockClient.postLogEvents).toHaveBeenCalledTimes(1)
    expect(mockClient.postLogEvents).toHaveBeenCalledWith([
      expect.objectContaining({ message: "test1" }),
      expect.objectContaining({ message: "test2" }),
    ])
  })

  it("sends batch after timeout", async () => {
    await batchInstance.addEvent({ msg: "test1" })

    // Wait for timeout
    await new Promise((resolve) => setTimeout(resolve, 150))

    expect(mockClient.postLogEvents).toHaveBeenCalledTimes(1)
    expect(mockClient.postLogEvents).toHaveBeenCalledWith([
      expect.objectContaining({ message: "test1" }),
    ])
  })

  it("clears timeout when batch is sent", async () => {
    await batchInstance.addEvent({ msg: "test1" })
    await batchInstance.addEvent({ msg: "test2" })

    // Wait for timeout
    await new Promise((resolve) => setTimeout(resolve, 150))

    expect(mockClient.postLogEvents).toHaveBeenCalledTimes(1)
  })

  it("sends remaining events on close", async () => {
    await batchInstance.addEvent({ msg: "test1" })
    await batchInstance.close()

    expect(mockClient.postLogEvents).toHaveBeenCalledTimes(1)
    expect(mockClient.postLogEvents).toHaveBeenCalledWith([
      expect.objectContaining({ message: "test1" }),
    ])
  })
})

describe("batch instance while a send is in flight", () => {
  let posted
  let resolvers
  let batchInstance

  // Lets the code after a resolved `await` run before the test continues.
  const flushMicrotasks = async () => {
    for (let i = 0; i < 10; i++) await Promise.resolve()
  }

  beforeEach(() => {
    jest.useFakeTimers()
    posted = []
    resolvers = []
    // Each post stays in flight until the test resolves it.
    const mockClient = {
      postLogEvents: jest.fn((batch) => {
        posted.push(batch.map((event) => event.message))
        return new Promise((resolve) => resolvers.push(resolve))
      }),
    }
    batchInstance = createBatchInstance(
      { batchSize: 2, batchTimeout: 100 },
      mockClient,
    )
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  // The first event arms the batch timeout; the second fills the batch and
  // starts a send that has not finished yet.
  const startFullBatchSend = () => {
    batchInstance.addEvent({ msg: "test1" })
    return batchInstance.addEvent({ msg: "test2" })
  }

  it("does not send a batch again when the timeout fires during its send", async () => {
    startFullBatchSend()

    jest.advanceTimersByTime(100)

    expect(posted).toEqual([["test1", "test2"]])
  })

  it("does not drop events added after an earlier send finishes", async () => {
    const fullBatchSend = startFullBatchSend()
    jest.advanceTimersByTime(100)

    resolvers[0]()
    await fullBatchSend
    await batchInstance.addEvent({ msg: "test3" })

    resolvers.slice(1).forEach((resolve) => resolve())
    await flushMicrotasks()
    jest.advanceTimersByTime(100)
    resolvers.forEach((resolve) => resolve())
    await batchInstance.close()

    expect(posted.flat()).toEqual(["test1", "test2", "test3"])
  })

  it("does not send a batch again when closed during its send", async () => {
    startFullBatchSend()

    const closing = batchInstance.close()
    resolvers.forEach((resolve) => resolve())
    await closing

    expect(posted).toEqual([["test1", "test2"]])
  })
})
