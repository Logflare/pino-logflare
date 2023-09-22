# API

The library exposes functions to write directly to Logflare from your own application either from the server and/or the client.

Example:

```js
import pino from "pino"
import { createPinoBrowserSend, createWriteStream } from "pino-logflare"

// create pino-logflare stream
const stream = createWriteStream({
  apiKey: "YOUR_API_KEY",
  sourceToken: "b1b334ff-686c-472d-8fd7-XXXXXXXXXXXX",
})

// create pino-logflare browser stream
const send = createPinoBrowserSend({
  apiKey: "YOUR_API_KEY",
  sourceToken: "b1b334ff-686c-472d-8fd7-XXXXXXXXXXXX",
})

// create pino loggger
const logger = pino(
  {
    browser: {
      transmit: {
        send: send,
      },
    },
  },
  stream
)

// log some events
logger.info("Informational message")
logger.error(new Error("things got bad"), "error message")

const child = logger.child({ property: "value" })
child.info("hello child!")
```

# JavaScript numbers to floats typecasting

To cast all numbers to floats you can use `jsNumbers: true` transforms option

```javascript
const stream = logflare.createWriteStream({
  apiKey: "PtzT2OSVy6LQ",
  apiBaseUrl: "http://localhost:4000",
  sourceToken: "6856e043-c872-47ff-96b3-dc4af93eeb12",
  transforms: {
    numbersToFloats: true,
  },
})
```

## Functions

### createWriteStream

The `createWriteStream` function creates a writestream.

Example:

```js
const writeStream = createWriteStream({
  apiKey: "API_KEY",
  sourceToken: "49e4f31e-f7e9-4f42-8c1e-xxxxxxxxxx",
})
```

To handle ingestion errors, add in the following option:

```js
const writeStream = createWriteStream({
  apiKey: "API_KEY",
  sourceToken: "49e4f31e-f7e9-4f42-8c1e-xxxxxxxxxx"
  // optional callback, callback be invoked on each error raised
  onError: (payload, err)=> {
    // do something with the ingestion payload that would have been sent to Logflare.
  }
});
```

To customize the payload, use the the `onPreparePayload` option:

```js
const writeStream = createWriteStream({
  ...,
  // optional callback, by default, the received object will be nested under the `metadata` key
  onPreparePayload: (payload, meta)=> {
    // the `meta` arg contains cleaned information of raw payload
    // You can add in top-level keys via this callback, or completely disable `metadata` key nesting by passing the payload as is, as shown below.
    return payload
  }
});
```

#### apiKey

Type: `String` _(required)_

The API key that can be found in your Logflare account.

#### sourceToken

Type: `String`

Set the source ID to which the logs are sent.

#### batchMaxSize

Type: `Number` _(optional)_

The number of log messages to send as a single batch (defaults to 1).

### createPinoBrowserSend

The `createPinoBrowserSend` function creates a writestream to send log events from the browser.

Example:

```js
const send = createPinoBrowserSend({
  apiKey: "API_KEY",
  sourceToken: "49e4f31e-f7e9-4f42-8c1e-xxxxxxxxxx",
})
```

#### apiKey

Type: `String` _(required)_

The API key that can be found in your Logflare account.

#### sourceToken

Type: `String`

Set the source ID to which the logs are sent.

#### batchMaxSize

Type: `Number` _(optional)_

The number of log messages to send as a single batch (defaults to 1).
