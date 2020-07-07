# API

The library exposes functions to write directly to Logflare from your own application either from the server and/or the client.

Example:

```js
import pino from 'pino'
import { createPinoBrowserSend, createWriteStream } from 'pino-logflare'

// create pino-logflare stream
const stream = createWriteStream({
    apiKey: "YOUR_API_KEY",
    sourceToken: "b1b334ff-686c-472d-8fd7-XXXXXXXXXXXX"
});

// create pino-logflare browser stream
const send = createPinoBrowserSend({
    apiKey: "YOUR_API_KEY",
    sourceToken: "b1b334ff-686c-472d-8fd7-XXXXXXXXXXXX"
});

// create pino loggger
const logger = pino({
    browser: {
        transmit: {
            send: send,
        }
    }
}, stream);

// log some events
logger.info("Informational message");
logger.error(new Error("things got bad"), "error message");

const child = logger.child({ property: "value" });
child.info("hello child!");
```

## Functions

### createWriteStream

The `createWriteStream` function creates a writestream.

Example:

```js
const writeStream = logflare.createWriteStream({
  apiKey: "API_KEY",
  sourceToken: "49e4f31e-f7e9-4f42-8c1e-xxxxxxxxxx",
  batchMaxSize: 1
});
```

#### apiKey

Type: `String` _(required)_

The API key that can be found in your Logflare account.

#### sourceToken

Type: `String`

Set the source ID to which the logs are sent.

#### batchMaxSize

Type: `String` _(optional)_

The number of log messages to send as a single batch (defaults to 1).

### createPinoBrowserSend

The `createPinoBrowserSend` function creates a writestream to send log events from the browser.

Example:

```js
const send = logflare.createPinoBrowserSend({
  apiKey: "API_KEY",
  sourceToken: "49e4f31e-f7e9-4f42-8c1e-xxxxxxxxxx",
  batchMaxSize: 1
});
```

#### apiKey

Type: `String` _(required)_

The API key that can be found in your Logflare account.

#### sourceToken

Type: `String`

Set the source ID to which the logs are sent.

#### batchMaxSize

Type: `String` _(optional)_

The number of log messages to send as a single batch (defaults to 1).
