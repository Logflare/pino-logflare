import {logflarePinoVercel, createWriteStream} from "./index"
import {Writable} from "stream"
import Pumpify from "pumpify"

describe("main", () => {
  it("logflarePinoVercel creates correct stream and transmit objects", async (done) => {
    const {stream, send} = logflarePinoVercel({
      apiKey: "testApiKey",
      sourceToken: "testSourceToken"
    })

    expect(stream).toBeInstanceOf(Writable)
    expect(send).toBeInstanceOf(Function)
    done()
  })

  it("creates a writable http stream", async (done) => {
    const writeStream = createWriteStream({
      apiBaseUrl: "http://localhost:4000/",
      apiKey: "test-key",
      sourceToken: "test-token",
    })
    expect(writeStream).toBeInstanceOf(Pumpify)
    done()
  })
})

