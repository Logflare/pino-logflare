import { HttpClient } from "logflare-transport-core"
import pinoLogflare, { createWriteStream, logflarePinoVercel } from "./index"

jest.mock("logflare-transport-core")

const baseOptions = { apiKey: "testApiKey", sourceToken: "testSourceToken" }
const clientOptions = () => HttpClient.mock.calls[0][0]

describe("requestTimeout", () => {
  beforeEach(() => {
    HttpClient.mockClear()
  })

  it("defaults to 5000 for the worker transport", async () => {
    const stream = await pinoLogflare(baseOptions)
    stream.destroy()

    expect(clientOptions().requestTimeout).toBe(5000)
  })

  it.each([2000, 0])(
    "keeps a requestTimeout of %p set for the worker transport",
    async (requestTimeout) => {
      const stream = await pinoLogflare({ ...baseOptions, requestTimeout })
      stream.destroy()

      expect(clientOptions().requestTimeout).toBe(requestTimeout)
    },
  )

  it("is not set by default for createWriteStream", () => {
    createWriteStream(baseOptions)

    expect(clientOptions().requestTimeout).toBeUndefined()
  })

  it("is not set by default for the browser and Vercel send", () => {
    logflarePinoVercel(baseOptions)

    expect(clientOptions().requestTimeout).toBeUndefined()
  })
})
