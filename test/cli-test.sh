#!/bin/bash

# Start mock API in background

# Wait for mock API to start
sleep 2

# Test basic logging
echo "Testing basic logging..."
echo '{"level":30,"time":1234567890,"msg":"Test log"}' | node ./dist/cli.js -k test-api-key -s test-source-token -u http://localhost:4000

# Test error logging
echo "Testing error logging..."
echo '{"level":50,"time":1234567890,"msg":"Test error","err":{"message":"Test error message"}}' | node ./dist/cli.js -k test-api-key -s test-source-token -u http://localhost:4000

# Test invalid API key
echo "Testing invalid API key..."
echo '{"level":30,"time":1234567890,"msg":"Test log"}' | node ./dist/cli.js -k invalid-key -s test-source-token -u http://localhost:4000

# Test invalid source token
echo "Testing invalid source token..."
echo '{"level":30,"time":1234567890,"msg":"Test log"}' | node ./dist/cli.js -k test-api-key -s invalid-token -u http://localhost:4000

echo "CLI tests completed" 