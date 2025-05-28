const express = require("express")
const bodyParser = require("body-parser")
const app = express()
const port = 4000

app.use(bodyParser.json())

// Mock authentication
app.use((req, res, next) => {
  const apiKey = req.headers["x-api-key"] || req.query.api_key
  if (!apiKey || apiKey !== "test-api-key") {
    console.error("Unauthorized", apiKey)
    return res.status(401).json({ error: "Unauthorized" })
  }
  next()
})

// Mock ingestion endpoint
app.post("/logs", (req, res) => {
  const { batch: logs } = req.body
  if (!logs) {
    return res.status(400).json({ error: "Bad request" })
  }

  console.log("Received logs:", {
    count: logs.length,
    sample: logs[0],
  })

  res.status(200).json({ success: true })
})

// Mock source validation endpoint
app.get("/sources/:sourceToken", (req, res) => {
  const { sourceToken } = req.params
  if (sourceToken !== "test-source-token") {
    return res.status(404).json({ error: "Source not found" })
  }

  res.status(200).json({
    id: "test-source-id",
    name: "Test Source",
    token: sourceToken,
  })
})

app.listen(port, () => {
  console.log(`Mock Logflare API listening at http://localhost:${port}`)
})
