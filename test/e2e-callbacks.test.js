/**
 * Integration tests for the new dynamic callback API
 * Tests the complete flow from pino logger to Logflare API
 */

import pino from "pino"
import { promisify } from "util"

const sleep = promisify(setTimeout)

// Mock ThreadStream to actually call the target transport
jest.mock("thread-stream", () => {
  return class ThreadStream {
    constructor(options = {}) {
      this.options = options
      this.logs = []
      this.closed = false
      this.events = {}
      this.target = null
      this.targetOptions = null

      // Extract target info from options
      this.target = options.workerData.targets[0].target
      this.targetOptions = options.workerData.targets[0].options

      // Initialize the actual transport
      this.initializeTransport()

      // Simulate async ready event
      setTimeout(() => {
        this.emit("ready")
      }, 10)
    }

    async initializeTransport() {
      // Dynamically import the target transport
      const transportModule = await import(this.target)
      const transport = transportModule.default || transportModule

      // Initialize the transport with options
      this.transportInstance = await transport(this.targetOptions)
      console.log("transport", this.transportInstance)
    }

    on(event, callback) {}

    emit(event, ...args) {}

    async write(data) {
      if (this.transportInstance) {
        const resp = await this.transportInstance.write(data)
        console.log("write", resp)
      }
    }

    end() {
      this.closed = true

      // Close the transport instance if it exists
      if (this.transportInstance && this.transportInstance.end) {
        this.transportInstance.end()
      }

      this.emit("close")
    }

    flushSync() {}

    unref() {
      // No-op for testing
    }

    ref() {
      // No-op for testing
    }
  }
})

describe("API Integration Tests", () => {
  let transport
  let logger
  let consoleSpy
  let consoleErrorSpy

  beforeEach(() => {
    // Setup spies for callback verification
    consoleSpy = jest.spyOn(console, "log")
    consoleErrorSpy = jest.spyOn(console, "error")
  })

  afterEach(async () => {
    // Clean up spies
    consoleSpy.mockRestore()
    consoleErrorSpy.mockRestore()
    transport = null
    logger = null

    // Clear all mocks
    jest.clearAllMocks()
  })

  test("successfully sends logs with imported onPreparePayload callback", async () => {
    const config = {
      apiKey: "test-api-key",
      sourceToken: "test-source-token",
      batchSize: 1,
      batchTimeout: 100,
      apiBaseUrl: "http://localhost:4000",
      onPreparePayload: {
        module: "../dist/utils",
        method: "handleLogPreparePayload",
      },
      onError: {
        module: "../dist/utils",
        method: "handleError",
      },
    }

    logger = pino({
      transport: {
        targets: [
          {
            target: "../dist/index",
            options: config,
          },
        ],
      },
    })

    // Send a test log
    await sleep(500)
    logger.info({ testData: "integration test" }, "Test message")
    // Wait for batch to be sent
    await sleep(500)

    // Verify the prepare payload callback was called
    expect(consoleSpy).toHaveBeenCalledWith(
      "handleLogPreparePayload",
      expect.objectContaining({
        level: 30,
        msg: "Test message",
        testData: "integration test",
      }),
      expect.any(Object),
    )
  })
})
