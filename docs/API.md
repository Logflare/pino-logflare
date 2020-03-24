# API

The library exposes a function to write directly to Logflare from your own application. The example below shows how this can be done using [pino-multi-stream](https://github.com/pinojs/pino-multi-stream).

Example:

```js
const logflare = require("pino-logflare");
const pinoms = require("pino-multi-stream");
// create the logflare destination stream
const writeStream = await logflare.createWriteStream();
// create pino loggger
const logger = pinoms({ streams: [writeStream] });
// log some events
logger.info("Informational message");
logger.error(new Error("things got bad"), "error message");
```

## Functions

### createWriteStream

The `createWriteStream` function creates a writestream that `pino-multi-stream` can use to send logs to. \*_This function is async because of compatibility reasons_

Example:

```js
const writeStream = await logflare.createWriteStream({
  apiKey: "blablabla",
  source: "49e4f31e-f7e9-4f42-8c1e-xxxxxxxxxx",
  size: 10
});
```

### createWriteStreamSync

The `createWriteStreamSync` function creates a writestream that `pino-multi-stream` can use to send logs to.

Example:

```js
const writeStream = logflare.createWriteStreamSync({
  apiKey: "blablabla",
  source: "49e4f31e-f7e9-4f42-8c1e-xxxxxxxxxx",
  size: 10
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
