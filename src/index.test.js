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
  let rejecters
  let batchInstance

  // Lets the code after a resolved `await` run before the test continues.
  const flushMicrotasks = async () => {
    for (let i = 0; i < 10; i++) await Promise.resolve()
  }

  beforeEach(() => {
    jest.useFakeTimers()
    posted = []
    resolvers = []
    rejecters = []
    // Each post stays in flight until the test resolves or rejects it.
    const mockClient = {
      postLogEvents: jest.fn((batch) => {
        posted.push(batch.map((event) => event.message))
        return new Promise((resolve, reject) => {
          resolvers.push(resolve)
          rejecters.push(reject)
        })
      }),
    }
    batchInstance = createBatchInstance(
      { batchSize: 2, batchTimeout: 100 },
      mockClient,
    )
  })

  afterEach(() => {
    jest.useRealTimers()
    jest.restoreAllMocks()
  })

  // The first event arms the batch timeout; the second fills the batch and
  // starts a send that has not finished yet. The pending send is returned in an
  // object so awaiting this helper doesn't wait for the send itself.
  const startFullBatchSend = async () => {
    batchInstance.addEvent({ msg: "test1" })
    const fullBatchSend = batchInstance.addEvent({ msg: "test2" })
    await flushMicrotasks()
    return { fullBatchSend }
  }

  it("does not send a full batch again when its timeout comes due during the send", async () => {
    const { fullBatchSend } = await startFullBatchSend()

    jest.advanceTimersByTime(100)
    await flushMicrotasks()

    expect(posted).toEqual([["test1", "test2"]])

    resolvers[0]()
    await fullBatchSend
  })

  it("does not drop events added after an earlier send finishes", async () => {
    const { fullBatchSend } = await startFullBatchSend()
    jest.advanceTimersByTime(100)
    resolvers[0]()
    await fullBatchSend

    await batchInstance.addEvent({ msg: "test3" })
    jest.advanceTimersByTime(100)
    await flushMicrotasks()
    resolvers[1]()
    await batchInstance.close()

    expect(posted).toEqual([["test1", "test2"], ["test3"]])
  })

  it("waits for the in-flight send when closed, without sending it again", async () => {
    await startFullBatchSend()

    let closed = false
    const closing = batchInstance.close().then(() => {
      closed = true
    })
    await flushMicrotasks()
    expect(closed).toBe(false)

    resolvers[0]()
    await closing

    expect(posted).toEqual([["test1", "test2"]])
  })

  it("sends pending events on close without waiting for the post in flight", async () => {
    batchInstance.addEvent({ msg: "test1" })
    jest.advanceTimersByTime(100)
    await flushMicrotasks()
    batchInstance.addEvent({ msg: "test2" })

    let closed = false
    const closing = batchInstance.close().then(() => {
      closed = true
    })
    await flushMicrotasks()

    expect(posted).toEqual([["test1"], ["test2"]])

    resolvers[1]()
    await flushMicrotasks()
    expect(closed).toBe(false)

    resolvers[0]()
    await closing

    expect(posted).toEqual([["test1"], ["test2"]])
  })

  it("finishes a send only once no post is in flight", async () => {
    batchInstance.addEvent({ msg: "test1" })
    jest.advanceTimersByTime(100)
    await flushMicrotasks()
    batchInstance.addEvent({ msg: "test2" })

    // Both wait for the first post; the first to resume sends test2.
    const first = batchInstance.sendBatch()
    let secondDone = false
    const second = batchInstance.sendBatch().then(() => {
      secondDone = true
    })
    resolvers[0]()
    await flushMicrotasks()

    expect(posted).toEqual([["test1"], ["test2"]])
    expect(secondDone).toBe(false)

    resolvers[1]()
    await first
    await second
  })

  it("starts a send only after the previous one finishes", async () => {
    batchInstance.addEvent({ msg: "test1" })
    jest.advanceTimersByTime(100)
    batchInstance.addEvent({ msg: "test2" })
    const fullBatchSend = batchInstance.addEvent({ msg: "test3" })
    await flushMicrotasks()

    expect(posted).toEqual([["test1"]])

    resolvers[0]()
    await flushMicrotasks()

    expect(posted).toEqual([["test1"], ["test2", "test3"]])

    resolvers[1]()
    await fullBatchSend
  })

  it("sends events added during a slow send together in the next post", async () => {
    batchInstance.addEvent({ msg: "test1" })
    jest.advanceTimersByTime(100)
    await flushMicrotasks()

    // Each event's timeout fires while the first post is still in flight.
    batchInstance.addEvent({ msg: "test2" })
    jest.advanceTimersByTime(100)
    batchInstance.addEvent({ msg: "test3" })
    jest.advanceTimersByTime(100)
    await flushMicrotasks()

    expect(posted).toEqual([["test1"]])

    resolvers[0]()
    await flushMicrotasks()

    expect(posted).toEqual([["test1"], ["test2", "test3"]])

    resolvers[1]()
    await batchInstance.close()

    expect(posted).toEqual([["test1"], ["test2", "test3"]])
  })

  it("keeps sending when the client throws synchronously", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {})
    const throwingClient = {
      postLogEvents: jest.fn(() => {
        throw new Error("sync throw")
      }),
    }
    const instance = createBatchInstance(
      { batchSize: 1, batchTimeout: 100 },
      throwingClient,
    )

    await instance.addEvent({ msg: "test1" })
    await instance.addEvent({ msg: "test2" })
    await instance.close()

    expect(throwingClient.postLogEvents).toHaveBeenCalledTimes(2)
  })

  it("does not fail close() after an earlier send failed", async () => {
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => {})
    batchInstance.addEvent({ msg: "test1" })
    jest.advanceTimersByTime(100)
    await flushMicrotasks()

    rejecters[0](new Error("onError threw"))
    await flushMicrotasks()

    // Nothing is pending, so close() must not rethrow the earlier failure.
    await batchInstance.close()

    expect(consoleError).toHaveBeenCalledTimes(1)
    expect(posted).toEqual([["test1"]])
  })

  it("keeps sending after a failed send", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {})
    const { fullBatchSend } = await startFullBatchSend()

    rejecters[0](new Error("onError threw"))
    await fullBatchSend

    batchInstance.addEvent({ msg: "test3" })
    jest.advanceTimersByTime(100)
    await flushMicrotasks()
    resolvers[1]()
    await batchInstance.close()

    expect(posted).toEqual([["test1", "test2"], ["test3"]])
  })
})
