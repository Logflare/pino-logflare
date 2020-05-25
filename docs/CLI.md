# CLI

To use `pino-logflare` from the command line, you need to install it globally:

```bash
$ npm install -g pino-logflare
```

Alternatively, if you install it locally you can safely use it within `package.json` scripts.

## Example

Given an application `index.js` that logs via pino, you would use `pino-logflare` like so:

index.js
```javascript
const logger = require("pino")();

logger.info("hello world");

const child = logger.child({ property: "value" });
child.info("hello child!");
```


```bash
$ node index.js | pino-logflare --key YOUR_KEY --source YOUR_SOURCE_ID
```

## Usage

You can pass the following options via cli arguments or use the environment variable associated:

| Short command | Full command            | Environment variable | Description                                                          |
| ------------- | ----------------------- | -------------------- | -------------------------------------------------------------------- |
| -V            | --version               |                      | Output the version number                                            |
| -k            | --key &lt;apikey&gt;    | LOGFLARE_API_KEY     | The API key that can be found in your Logflare account               |
| -s            | --source &lt;source&gt; | LOGFLARE_SOURCE_TOKEN| Default source for the logs                                          |
| -h            | --help                  |                      | Output usage information                                             |

See the [API](./API.md) documentation for details.
