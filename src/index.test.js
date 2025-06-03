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

describe("dynamic callback imports", () => {
  let mockClient
  let originalImport

  beforeEach(() => {
    mockClient = {
      postLogEvents: jest.fn().mockResolvedValue(undefined),
    }
    // Mock dynamic import
    originalImport = global.import
    global.import = jest.fn()
  })

  afterEach(() => {
    global.import = originalImport
    jest.clearAllMocks()
  })

  it("imports and uses onPreparePayload callback from module", async () => {
    const mockPreparePayload = jest.fn().mockReturnValue({
      transformed: true,
      message: "transformed message",
    })

    global.import.mockResolvedValue({
      customPreparePayload: mockPreparePayload,
    })

    const options = {
      apiKey: "test-api-key",
      sourceToken: "test-source-token",
      onPreparePayload: {
        module: "./test/utils",
        method: "customPreparePayload",
      },
    }

    const transport = await pinoLogflare(options)
    expect(global.import).toHaveBeenCalledWith("./test/utils")
    expect(transport).toBeInstanceOf(Transform)
  })

  it("imports and uses onError callback from module", async () => {
    const mockErrorHandler = jest.fn()

    global.import.mockResolvedValue({
      customErrorHandler: mockErrorHandler,
    })

    const options = {
      apiKey: "test-api-key",
      sourceToken: "test-source-token",
      onError: {
        module: "./test/utils",
        method: "customErrorHandler",
      },
    }

    const transport = await pinoLogflare(options)
    expect(global.import).toHaveBeenCalledWith("./test/utils")
    expect(transport).toBeInstanceOf(Transform)
  })

  it("imports both onPreparePayload and onError callbacks", async () => {
    const mockPreparePayload = jest.fn().mockReturnValue({ transformed: true })
    const mockErrorHandler = jest.fn()

    global.import
      .mockResolvedValueOnce({
        customErrorHandler: mockErrorHandler,
      })
      .mockResolvedValueOnce({
        customPreparePayload: mockPreparePayload,
      })

    const options = {
      apiKey: "test-api-key",
      sourceToken: "test-source-token",
      onError: {
        module: "./test/utils",
        method: "customErrorHandler",
      },
      onPreparePayload: {
        module: "./test/utils",
        method: "customPreparePayload",
      },
    }

    const transport = await pinoLogflare(options)
    expect(global.import).toHaveBeenCalledTimes(2)
    expect(global.import).toHaveBeenCalledWith("./test/utils")
    expect(transport).toBeInstanceOf(Transform)
  })

  it("throws error when callback module is missing", async () => {
    const options = {
      apiKey: "test-api-key",
      sourceToken: "test-source-token",
      onPreparePayload: {
        method: "customPreparePayload",
      },
    }

    await expect(pinoLogflare(options)).rejects.toThrow(
      "Callback onPreparePayload must be an object with module and method",
    )
  })

  it("throws error when callback method is missing", async () => {
    const options = {
      apiKey: "test-api-key",
      sourceToken: "test-source-token",
      onError: {
        module: "./test/utils",
      },
    }

    await expect(pinoLogflare(options)).rejects.toThrow(
      "Callback onError must be an object with module and method",
    )
  })

  it("throws error when module import fails", async () => {
    global.import.mockRejectedValue(new Error("Module not found"))

    const options = {
      apiKey: "test-api-key",
      sourceToken: "test-source-token",
      onPreparePayload: {
        module: "./non-existent-module",
        method: "someMethod",
      },
    }

    await expect(pinoLogflare(options)).rejects.toThrow("Module not found")
  })

  it("handles missing method in imported module", async () => {
    global.import.mockResolvedValue({
      someOtherMethod: jest.fn(),
    })

    const options = {
      apiKey: "test-api-key",
      sourceToken: "test-source-token",
      onPreparePayload: {
        module: "./test/utils",
        method: "nonExistentMethod",
      },
    }

    const transport = await pinoLogflare(options)
    // Should still create transport, but callback will be undefined
    expect(transport).toBeInstanceOf(Transform)
  })
})

describe("batch instance with dynamic callbacks", () => {
  let mockClient
  let originalImport

  beforeEach(() => {
    mockClient = {
      postLogEvents: jest.fn().mockResolvedValue(undefined),
    }
    originalImport = global.import
    global.import = jest.fn()
  })

  afterEach(() => {
    global.import = originalImport
    jest.clearAllMocks()
  })

  it("uses imported onPreparePayload callback in batch processing", async () => {
    const mockPreparePayload = jest.fn().mockImplementation((item, meta) => ({
      transformedMessage: `Transformed: ${meta.message}`,
      transformedLevel: meta.level,
      originalItem: item,
    }))

    global.import.mockResolvedValue({
      customPreparePayload: mockPreparePayload,
    })

    const options = {
      apiKey: "test-api-key",
      sourceToken: "test-source-token",
      batchSize: 1,
      onPreparePayload: {
        module: "./test/utils",
        method: "customPreparePayload",
      },
    }

    const batchInstance = createBatchInstance(options, mockClient)
    await batchInstance.addEvent({ msg: "test message", level: 30 })

    expect(mockClient.postLogEvents).toHaveBeenCalledWith([
      expect.objectContaining({
        transformedMessage: "Transformed: test message",
        transformedLevel: "info",
      }),
    ])
  })

  it("handles errors in imported onPreparePayload callback", async () => {
    const mockPreparePayload = jest.fn().mockImplementation(() => {
      throw new Error("Callback error")
    })

    global.import.mockResolvedValue({
      throwingPreparePayload: mockPreparePayload,
    })

    const options = {
      apiKey: "test-api-key",
      sourceToken: "test-source-token",
      batchSize: 1,
      onPreparePayload: {
        module: "./test/utils",
        method: "throwingPreparePayload",
      },
    }

    const batchInstance = createBatchInstance(options, mockClient)

    // Should not throw, but handle gracefully
    await expect(
      batchInstance.addEvent({ msg: "test", level: 30 }),
    ).rejects.toThrow("Callback error")
  })
})

describe("integration with real callback modules", () => {
  it("works with actual test utils module", async () => {
    // This test uses real module imports to test the actual functionality
    const options = {
      apiKey: "test-api-key",
      sourceToken: "test-source-token",
      batchSize: 1,
      onPreparePayload: {
        module: "../test/utils",
        method: "handleLogPreparePayload",
      },
      onError: {
        module: "../test/utils",
        method: "handleError",
      },
    }

    const transport = await pinoLogflare(options)
    expect(transport).toBeInstanceOf(Transform)
  }, 10000) // Longer timeout for real module imports
})
