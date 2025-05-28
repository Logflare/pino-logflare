import pino from "pino"

interface LogData {
  counter: number
  timestamp: string
  id: number
  data: string
  nested: {
    level1: {
      level2: {
        value: number
      }
    }
  }
}

// Test configuration
const config = {
  apiKey: "test-api-key",
  sourceToken: "test-source-token",
  batchSize: 15,
  batchTimeout: 3000,
  apiBaseUrl: "http://localhost:4000",
}

// Create logger with Logflare transport
const transport = pino.transport({
  targets: [
    // {
    //     target: 'pino/file',
    //     options: { destination: 1 } // this writes to STDOUT
    //   },
    { target: "../dist/index", options: config },
  ] as any,
})

const logger = pino(transport)

// Test data generators
const generateRandomString = (length: number): string => {
  return Array(length)
    .fill(0)
    .map(() => Math.random().toString(36).charAt(2))
    .join("")
}

const generateRandomObject = (): Omit<LogData, "counter" | "timestamp"> => {
  return {
    id: Math.floor(Math.random() * 1000),
    data: generateRandomString(10),
    nested: {
      level1: {
        level2: {
          value: Math.random(),
        },
      },
    },
  }
}

const generateRandomError = (): Error => {
  const errors = [
    new Error("Random error occurred"),
    new TypeError("Invalid type"),
    new RangeError("Value out of range"),
    new SyntaxError("Invalid syntax"),
    new ReferenceError("Undefined reference"),
  ]
  return errors[Math.floor(Math.random() * errors.length)]
}

// Log types with their frequencies (in ms)
const logTypes = [
  { type: "info" as const, interval: 10 },
  { type: "warn" as const, interval: 20 },
  { type: "error" as const, interval: 30 },
  { type: "debug" as const, interval: 40 },
]

// Start continuous logging
console.log("Starting continuous logging to Logflare...")
console.log("Press Ctrl+C to stop")

let counter = 0

// Initial test log
logger.info({ test: "initial" }, "Starting e2e test")

// Set up continuous logging
const logInterval = setInterval(() => {
  const logType = logTypes[Math.floor(Math.random() * logTypes.length)]
  const logData = generateRandomObject()

  try {
    switch (logType.type) {
      case "info":
        logger.info(logData, `Test log ${counter}`)
        break
      case "warn":
        logger.warn(logData, `Test warning ${counter}`)
        break
      case "error":
        logger.error(
          { error: generateRandomError(), ...logData },
          `Test error ${counter}`,
        )
        break
      case "debug":
        logger.debug(logData, `Test debug ${counter}`)
        break
    }
    counter++
    console.log(`Sent ${logType.type} log #${counter}`)
  } catch (err) {
    console.error("Error sending log:", err)
  }
}, 50)

// Handle cleanup
process.on("SIGINT", () => {
  clearInterval(logInterval)
  console.log("\nStopping e2e test...")
  transport.flushSync()
  process.exit(0)
})

const stderrLogger = pino({ name: "logger" }, pino.destination(2))
stderrLogger.info("Hello, world!")
