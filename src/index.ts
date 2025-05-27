import build from "pino-abstract-transport"
import createWriteStream from "./httpStream"
import createConsoleWriteStream from "./consoleStream"
import {
  defaultPreparePayload,
  extractPayloadMeta,
  handlePreparePayload,
} from "./utils"
import {
  Level,
  LogEvent,
  formatPinoBrowserLogEvent,
  addLogflareTransformDirectives,
} from "./utils"
import {
  LogflareHttpClient,
  LogflareUserOptionsI,
} from "logflare-transport-core"

interface LogflareTransportOptions extends LogflareUserOptionsI {
  size?: number
}

const isBrowser =
  typeof window !== "undefined" && typeof window.document !== "undefined"

const isNode =
  typeof process !== "undefined" &&
  process.versions != null &&
  process.versions.node != null

const createPinoBrowserSend = (options: LogflareUserOptionsI) => {
  const client = new LogflareHttpClient({ ...options, fromBrowser: true })

  return (level: Level | number, logEvent: LogEvent) => {
    const logflareLogEvent = formatPinoBrowserLogEvent(logEvent)
    const maybeWithTransforms = addLogflareTransformDirectives(
      logflareLogEvent,
      options,
    )
    client.postLogEvents([maybeWithTransforms])
  }
}

const logflarePinoVercel = (options: LogflareUserOptionsI) => {
  return {
    stream: createConsoleWriteStream(options),
    send: createPinoBrowserSend(options),
  }
}

export default async function (options: LogflareTransportOptions) {
  const client = new LogflareHttpClient(options)
  const { size = 1 } = options
  let batch: any[] = []

  return build(
    async function (newEvents) {
      for await (const event of newEvents) {
        const preparedEvents = handlePreparePayload(event, options)
        batch.push(preparedEvents)

        if (batch.length >= size) {
          await client.postLogEvents(batch)
          batch = []
        }
      }

      // Send any remaining logs
      if (batch.length > 0) {
        await client.postLogEvents(batch)
      }
    },
    {
      // Add stream options to properly handle stdin
      close: async () => {
        // Handle cleanup if needed
        if (batch.length > 0) {
          await client.postLogEvents(batch)
        }
      },
    },
  )
}

export {
  logflarePinoVercel,
  createPinoBrowserSend,
  createWriteStream,
  defaultPreparePayload,
  extractPayloadMeta,
}
