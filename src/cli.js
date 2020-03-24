#!/usr/bin/env node

const program = require("commander");

const pkg = require("../package.json");
const pinoLogflare = require("././index");

// main cli logic
function main() {
  program
    .version(pkg.version)
    .option("-k, --key <key>", "Logflare API Key")
    .option("-s, --source <source>", "Default source for the logs")
    .action(async options => {
      try {
        const config = {
          apiKey: options.key || process.env.LOGFLARE_API_KEY,
          source: options.source || process.env.LOGFLARE_SOURCE
        };
        const writeStream = await pinoLogflare.createWriteStream(config);
        process.stdin.pipe(writeStream);
        process.stdin.pipe(process.stdout);
      } catch (error) {
        console.error(error.message);
      }
    });

  program.parse(process.argv);
}

main();
