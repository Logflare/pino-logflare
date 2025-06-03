import build from "pino-abstract-transport"
import createWriteStream from "./httpStream"
import createConsoleWriteStream from "./consoleStream"
import {
  defaultPreparePayload,
  extractPayloadMeta,
  handlePreparePayload,
} from "./utils"
import { Level, LogEvent, formatPinoBrowserLogEvent } from "./utils"
import { HttpClient, HttpClientOptions } from "logflare-transport-core"

interface LogflareTransportOptions extends HttpClientOptions {
  batchSize?: number
  batchTimeout?: number // timeout in ms before sending batch
  onError?: any
  onPreparePayload?: any
}

interface BatchInstance {
  sendBatch: () => Promise<void>
  addEvent: (event: any) => Promise<void>
  close: () => Promise<void>
}

const createPinoBrowserSend = (options: HttpClientOptions) => {
  const client = new HttpClient(options)

  return (level: Level | number, logEvent: LogEvent) => {
    const logflareLogEvent = formatPinoBrowserLogEvent(logEvent)
    client.postLogEvents([logflareLogEvent])
  }
}

const logflarePinoVercel = (options: HttpClientOptions) => {
  return {
    stream: createConsoleWriteStream(options),
    send: createPinoBrowserSend(options),
  }
}

const createBatchInstance = (
  options: LogflareTransportOptions,
  client: HttpClient,
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
  let clientOptions: LogflareTransportOptions = options
  for (const cbName of ["onError", "onPreparePayload"]) {
    const callbackTarget = options[cbName as keyof LogflareTransportOptions]
    if (callbackTarget) {
      const callback = await importCallback(cbName, callbackTarget)
      clientOptions = { ...clientOptions, [cbName]: callback }
    }
  }

  const client = new HttpClient(clientOptions)
  const batchInstance = createBatchInstance(clientOptions, client)

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

const importCallback = async (
  callbackName: string,
  target: { module: string; method: string },
) => {
  const { module, method } = target
  if (!module || !method) {
    throw new Error(
      `Callback ${callbackName} must be an object with module and method, to import the callback on the worker thread`,
    )
  }

  const importedModule = await import(module)
  const importedMethod = importedModule[method]
  return importedMethod
}

export {
  logflarePinoVercel,
  createPinoBrowserSend,
  createWriteStream,
  defaultPreparePayload,
  extractPayloadMeta,
  createBatchInstance,
}
