#!/bin/bash

echo "Starting Localbite Servers in new terminals..."

# Get absolute path to current directory
WORKSPACE_DIR="$PWD"

# Start Backend in a new Terminal window
echo "Starting FastAPI Backend..."
osascript -e "tell application \"Terminal\" to do script \"cd '$WORKSPACE_DIR/localbite-backend' && source venv/bin/activate && uvicorn main:app --reload --port 8000\""

# Start Frontend in a new Terminal window
echo "Starting React Frontend..."
osascript -e "tell application \"Terminal\" to do script \"cd '$WORKSPACE_DIR/localbite-frontend' && npm start\""

echo "Servers have been launched in separate Terminal windows."
