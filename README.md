# pino-logflare

A transport for [Pino](https://getpino.io/#/) that sends messages to Logflare.

## Features

- Supports all Pino log levels
- Automatic batching of logs
- Custom payload transformation
- Vercel Edge Runtime support
- Error handling
- TypeScript support

> [!NOTE]  
> pino-logflare v0.5.0 and above is Pino +v7 compatible and remains backwards compatible.

## Installation

```bash
npm install pino pino-logflare
```

## Usage

Pino +v7 compatible transport.

```javascript
const pino = require("pino")
const transport = pino.transport({
  target: "pino-logflare",
  options: {
    apiKey: "your-api-key",
    sourceToken: "your-source-token",
    // either sourceToken or sourceName can be provided. sourceToken takes precedence.
    // sourceName: "my.source.name",
    // handle errors on the client side
    onError: { module: "my_utils", method: "handleErrors" },
    // transform events before sending
    onPreparePayload: { module: "my_utils", method: "handlePayload" },
  },
})
const logger = pino(transport)

logger.info("Hello Logflare!")
```

### Handle Errors

Create a separate module that contains the exported function. Error information, usually an `Error` instance, is received as the second argument.

```js
// my_utils.js
export const handleErrors = (events, error) => {...}
```

Provide the target module and method to be used for the `handleErrors` option.

```js
// my_logger.js
const pino = require("pino")

const transport = pino.transport({
  target: "pino-logflare",
  options: {
    ...,
    onError: {module: "my_utils", method: "handleErrors"},
  },
})
const logger = pino(transport)
```

The method will be dynamically imported on the worker thread.

### Transforming Events

Create a separate module that contains the exported function. Payload metadata is received as the 2nd argument.

```js
// my_utils.js
export const handlePayload = (events, meta) => {...}
```

Provide the target module and method to be used for the `onPreparePayload` option.

```js
// my_logger.js
const pino = require("pino")

const transport = pino.transport({
  target: "pino-logflare",
  options: {
    ...,
    onPreparePayload: {module: "my_utils", method: "handlePayload"},
  },
})
const logger = pino(transport)
```

The method will be dynamically imported on the worker thread.

## Package Functions

The default import should be used for all pino +v7 transport usage.

### createWriteStream (deprecated)

The `createWriteStream` function creates a writestream. This is deprecated in favour of the default import of the package which is pino +v7 compatible.

<details>
<summary>Example usage of <code>contentWriteStream</code></summary>
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
import { defaultPreparePayload } from "pino-logflare"

const writeStream = createWriteStream({
  ...,
  // optional callback, by default, the received object will be nested under the `metadata` key
  onPreparePayload: (payload, meta)=> {
    // the `meta` arg contains cleaned information of raw payload
    // You can add in top-level keys via this callback, or completely disable `metadata` key nesting by passing the payload as is, as shown below.
    const item = defaultPreparePayload(payload, meta)
    item["my_custom_key"] = "some value'
    return item
  }
});
```

</details>

### createPinoBrowserSend

The `createPinoBrowserSend` function creates a writestream to [send log events from the browser](https://getpino.io/#/docs/browser?id=transmit-object).

Example:

```js
const send = createPinoBrowserSend({
  apiKey: "API_KEY",
  sourceToken: "49e4f31e-f7e9-4f42-8c1e-xxxxxxxxxx",
})
```

### Library Configuration Options

| Option             | Type                | Description                                                                                                                                                                                                                |
| ------------------ | ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apiKey`           | Required, `string`  | Your Logflare API key                                                                                                                                                                                                      |
| `sourceToken`      | Required, `string`  | Your Logflare source token                                                                                                                                                                                                 |
| `apiBaseUrl`       | Optional, `string`  | Custom API endpoint (defaults to Logflare's API)                                                                                                                                                                           |
| `size`             | Optional, `number`  | Number of logs to batch before sending (defaults to 1)                                                                                                                                                                     |
| `onPreparePayload` | Optional, `Object`  | Object with a `module` and `method` to be invoked on the worker thread. The method should transform events prior to sending. <br />Receives the events as the first arg and the payload metadata as the second arg         |
| `onError`          | Optional, `Object`  | Object with a `module` and `method` to be invoked on the worker thread. This method is invoked on errors when sending events to the given API. <br />Receives the events as the first arg and the error as the second arg. |
| `batchSize`        | Optional, `number`  | Number of logs to batch before sending (defaults to 100)                                                                                                                                                                   |
| `batchTimeout`     | Optional, `number`  | Time in milliseconds to wait before sending partial batch (defaults to 1000)                                                                                                                                               |
| `debug`            | Optional, `boolean` | Turns on debug console logs on the base HTTP client.                                                                                                                                                                       |

**Note:** `batchSize` and `batchTimeout` options are available only for Pino +v7.

**Note:** `onPreparePayload` and `onError` options only accept callbacks for up to Pino v6 with legacy API. This is deprecated, please migrate to dynamic import based callbacks.

### ⚠️ Deprecated Options

The following options are deprecated and will be removed in a future version:

| Option        | Status         | Migration                                               |
| ------------- | -------------- | ------------------------------------------------------- |
| `transforms`  | **Deprecated** | Server-side transforms are no longer supported.         |
| `endpoint`    | **Deprecated** | Use `apiBaseUrl` instead                                |
| `fromBrowser` | **Deprecated** | This option is no longer necessary for the HTTP Client. |

## CLI

```bash
# install pino-logflare globally
$ npm install -g pino-logflare

# pipe text to be logged
$ echo "this is a test" | pino-logflare --key YOUR_KEY --source YOUR_SOURCE_ID

# with custom API URL
$ echo "this is a test" | pino-logflare --key YOUR_KEY --source YOUR_SOURCE_ID --url https://custom.logflare.app
```

### Example with node script

Given an application `index.js` that logs via pino, you would use `pino-logflare` like so:

```javascript
// index.js
const logger = require("pino")()

logger.info("hello world")

const child = logger.child({ property: "value" })
child.info("hello child!")
```

```bash
$ node index.js | pino-logflare --key YOUR_KEY --source YOUR_SOURCE_ID
```

### CLI Options

You can pass the following options via cli arguments or use the environment variable associated:

| Short command | Full command            | Environment variable    | Description                                            |
| ------------- | ----------------------- | ----------------------- | ------------------------------------------------------ |
| -k            | --key &lt;apikey&gt;    | `LOGFLARE_API_KEY`      | The API key that can be found in your Logflare account |
| -s            | --source &lt;source&gt; | `LOGFLARE_SOURCE_TOKEN` | Default source for the logs                            |
| -u            | --url &lt;url&gt;       | `LOGFLARE_URL`          | Custom Logflare API URL (optional)                     |

## Vercel

To use `pino-logflare` in your Vercel project you have to configure:

- Logflare Vercel [integration](https://vercel.com/integrations/logflare) that will handle serverless functions log events
- Pino browser `send` function to handle log events from the browser client

Example:

```js
import pino from "pino"
import { logflarePinoVercel } from "pino-logflare"

// create pino-logflare console stream for serverless functions and send function for browser logs
const { stream, send } = logflarePinoVercel({
  apiKey: "YOUR_KEY",
  sourceToken: "XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXX",
})

// create pino logger
const logger = pino(
  {
    browser: {
      transmit: {
        level: "info",
        send: send,
      },
    },
    level: "debug",
    base: {
      env: process.env.VERCEL_ENV,
      revision: process.env.VERCEL_GITHUB_COMMIT_SHA,
    },
  },
  stream,
)
```

## Development

### Setup

```bash
npm i
npm run build
npm test
npm run test.watch

# e2e tests
npm run start:api
npm run test:e2e
```

## License

MIT

[pino]: https://www.npmjs.com/package/pino
[logflare]: https://logflare.app/
