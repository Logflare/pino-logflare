'use strict'

const logflare = require('../src/logflare')

async function main() {
  const apiKey = process.env.LOGFLARE_API_KEY
  const client = new logflare.Client({ apiKey })

  // await client.validate()
  await client.insert({
    message: 'pino test',
    source: 'bla',
    ddtags: 'foo:bar',
  })

  // let ws = client.insertStream()
  // ws.write({ id: 1 })
  // ws.end()
}

main()
