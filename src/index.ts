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
  // The post in flight, if any. Outside close(), only one post runs at a time,
  // so batches arrive in order.
  let inFlight: Promise<void> | null = null

  // Never rejects, so callers waiting on it can't fail because of an earlier
  // post.
  const post = async (events: any[]) => {
    try {
      await client.postLogEvents(events)
    } catch (err) {
      // postLogEvents reports network and API errors through onError and
      // resolves. It rejects only if onError itself throws. Failed batches are
      // not retried.
      console.error(
        `pino-logflare: dropped ${events.length} events after a failed send:`,
        err,
      )
    }
  }

  const clearBatchTimeout = () => {
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
  }

  /**
   * Clears the timeout, waits until no post is in flight, then posts the
   * pending events. Taking the events before posting means a timeout during a
   * post can't send them again or drop events added while it runs. Events added
   * while waiting go out together in one post, so a slow endpoint doesn't build
   * a queue of small posts. Resolves once the post it started has finished.
   */
  const sendBatch = async () => {
    clearBatchTimeout()
    while (inFlight) {
      await inFlight
    }
    if (batch.length === 0) {
      return
    }
    const events = batch
    batch = []
    const sending = post(events)
    inFlight = sending
    await sending
    // This continuation runs before those of callers waiting on the same post,
    // so this is still `sending`. The check guards against clearing a newer
    // post if that ever changes.
    if (inFlight === sending) {
      inFlight = null
    }
  }

  /**
   * Posts the pending events right away, without waiting for the post in
   * flight, then waits for both. At shutdown pino only waits a limited time,
   * so the last events must not queue behind a slow post.
   */
  const close = async () => {
    clearBatchTimeout()
    const pending: Promise<void>[] = []
    if (inFlight) {
      pending.push(inFlight)
    }
    if (batch.length > 0) {
      const events = batch
      batch = []
      pending.push(post(events))
    }
    await Promise.all(pending)
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
    close,
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
