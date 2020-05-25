# API

The library exposes a function to write directly to Logflare from your own application. The example below shows how this can be done using [pino-multi-stream](https://github.com/pinojs/pino-multi-stream).

Example:

```js
const pino = require("pino");
const logflare = require("pino-logflare");

// create pino-logflare stream
const stream = logflare.createWriteStream({
  apiKey: "YOUR_KEY",
  sourceToken: "YOUR_SOURCE_ID",
  apiBaseUrl: "YOUR_API_BASE_URL", // optional
  batchMaxSize: 1 // optional
});

// create pino loggger
const logger = pino({}, stream);

// log some events
logger.info("Informational message");
logger.error(new Error("things got bad"), "error message");

const child = logger.child({ property: "value" });
child.info("hello child!");
```

## Functions

### createWriteStream

The `createWriteStreamSync` function creates a writestream that `pino-multi-stream` can use to send logs to.

Example:

```js
const writeStream = logflare.createWriteStreamSync({
  apiKey: "API_KEY",
  sourceToken: "49e4f31e-f7e9-4f42-8c1e-xxxxxxxxxx",
  batchMaxSize: 1
});
```

#### apiKey

Type: `String` _(required)_

The API key that can be found in your Logflare account (Integration > APIs).

#### source

Type: `String`

Set the source to which the logs are sent

#### size

Type: `String` _(optional)_

The number of log messages to send as a single batch (defaults to 1).
