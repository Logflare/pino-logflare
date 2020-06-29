import consoleStream from './consoleStream'

describe("Console stream", () => {
  let consoleLogData = ""
  const storeLog = (inputs) => (consoleLogData += inputs)
  it("streams correctly", async (done) => {
    console["log"] = jest.fn(storeLog)

    const stream = consoleStream({})
    stream.write(JSON.stringify({id: 1, name: `item first`}))

    stream.end()

    const parsedLogData = JSON.parse(consoleLogData)

    expect(parsedLogData).toMatchObject({
        "metadata": {
          "context": {},
          "id": 1,
          "name": "item first",
          "level": "info"
        },
        "message": "info"
      }
    )
    done()
  })
})

