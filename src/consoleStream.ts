import { handlePreparePayload } from "./utils"
import { addLogflareTransformDirectives } from "./utils"
import { Options } from "./httpStream"

const createConsoleWriteStream = (options: Options) => {
  return {
    write: (chunk: any) => {
      const batch = Array.isArray(chunk) ? chunk : [chunk]
      batch
        .map((chunkItem) => JSON.parse(chunkItem))
        .map((item) => handlePreparePayload(item, options))
        .map((logEntry: Record<string, any>) =>
          addLogflareTransformDirectives(logEntry, options),
        )
        .map((chunkItem) => JSON.stringify(chunkItem))
        .forEach((x) => {
          process.stdout.write(x + "\n")
        })
    },
  }
}

export default createConsoleWriteStream
