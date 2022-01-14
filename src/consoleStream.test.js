import { mockProcessStdout } from "jest-mock-process"

describe("Console stream", () => {
  let consoleStream
  let mockStdout

  beforeAll(() => {
    mockStdout = mockProcessStdout()
    consoleStream = require("./consoleStream").default
  })

  it("streams correctly", () => {
    const stream = consoleStream()
    stream.write(
      JSON.stringify({ id: 1, name: `item first`, time: 1594310416073 })
    )

    expect(mockStdout).toHaveBeenCalledWith(
      '{"metadata":{"id":1,"name":"item first","context":{},"level":"info"},"message":"info","timestamp":1594310416073}\n'
    )
  })
})
