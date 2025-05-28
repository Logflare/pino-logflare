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

interface LogflareTransportOptions
  extends Pick<
    LogflareUserOptionsI,
    "apiKey" | "sourceToken" | "apiBaseUrl" | "onError"
  > {
  batchSize?: number
  batchTimeout?: number // timeout in ms before sending batch
}

interface BatchInstance {
  sendBatch: () => Promise<void>
  addEvent: (event: any) => Promise<void>
  close: () => Promise<void>
}

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

const createBatchInstance = (
  options: LogflareTransportOptions,
  client: LogflareHttpClient,
): BatchInstance => {
  const { batchSize = 100, batchTimeout = 1000 } = options
  let batch: any[] = []
  let timeoutId: NodeJS.Timeout | null = null

  const sendBatch = async () => {
    if (batch.length > 0) {
      await client.postLogEvents(batch)
      batch = []
    }
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
  }

  const addEvent = async (event: any) => {
    const preparedEvents = handlePreparePayload(event, options)
    batch.push(preparedEvents)

    if (batch.length >= batchSize) {
      await sendBatch()
    } else if (!timeoutId) {
      timeoutId = setTimeout(sendBatch, batchTimeout)
    }
  }

  return {
    sendBatch,
    addEvent,
    close: sendBatch,
  }
}

export default async function (options: LogflareTransportOptions) {
  const client = new LogflareHttpClient(options)
  const batchInstance = createBatchInstance(options, client)

  return build(
    async function (newEvents) {
      for await (const event of newEvents) {
        await batchInstance.addEvent(event)
      }
      await batchInstance.sendBatch()
    },
    {
      close: batchInstance.close,
    },
  )
}

export {
  logflarePinoVercel,
  createPinoBrowserSend,
  createWriteStream,
  defaultPreparePayload,
  extractPayloadMeta,
  createBatchInstance,
}
