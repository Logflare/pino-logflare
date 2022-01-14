import { toLogEntry } from "./utils"
import { LogflareUserOptionsI } from "logflare-transport-core"
import { addLogflareTransformDirectives } from "./utils"

const createConsoleWriteStream = (options: LogflareUserOptionsI) => {
  return {
    write: (chunk: any) => {
      const batch = Array.isArray(chunk) ? chunk : [chunk]
      batch
        .map((chunkItem) => JSON.parse(chunkItem))
        .map(toLogEntry)
        .map((logEntry: Record<string, any>) =>
          addLogflareTransformDirectives(logEntry, options)
        )
        .map((chunkItem) => JSON.stringify(chunkItem))
        .forEach((x) => {
          process.stdout.write(x + "\n")
        })
    },
  }
}

export default createConsoleWriteStream
