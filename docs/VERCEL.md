# Vercel

To use `pino-logflare` in your Vercel project you have to configure:

* Logflare Vercel [integration](https://vercel.com/integrations/logflare) that will handle serverless functions log events
* Pino browser `send` function to handle log events from the browser client

Example:

```js
import pino from 'pino'
import { logflarePinoVercel } from 'pino-logflare'

// create pino-logflare console stream for serverless functions and send function for browser logs
const { stream, send } = logflarePinoVercel({
    apiKey: "YOUR_KEY",
    sourceToken: "0666b118-b754-45cc-bf19-XXXXXXXXXXX"
});

// create pino loggger
const logger = pino({
    browser: {
        transmit: {
            level: "info",
            send: send,
        }
    },
    level: "debug",
    base: {
        env: env: process.env.NODE_ENV,
        revision: process.env.VERCEL_GITHUB_COMMIT_SHA,
    },
}, stream);
```

#### apiKey

Type: `String` _(required)_

The API key that can be found in your Logflare account (Integration > APIs).

#### source

Type: `String`

Set the source to which the logs are sent
