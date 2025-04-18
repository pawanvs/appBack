#!/bin/bash
echo "🚀 Starting AppBack Express server + Redis worker..."

# Start Express server in background
node index.js &
# node index.js

# Start the worker (this stays in the foreground)
node workers/mongoWorker.js

# Optional: keep container alive
# wait -n

