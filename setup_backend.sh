#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "Setting up Backend Environment..."

# Navigate to backend directory
cd localbite-backend

# Check if python3 is available
if ! command -v python3 &> /dev/null; then
    echo "python3 could not be found. Please install Python 3."
    exit 1
fi

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
else
    echo "Virtual environment already exists."
fi

# Activate virtual environment
source venv/bin/activate

# Upgrade pip
echo "Upgrading pip..."
pip install --upgrade pip

# Install dependencies
echo "Installing Python modules..."
pip install fastapi "uvicorn[standard]" python-dotenv

# Freeze dependencies to requirements.txt
pip freeze > requirements.txt
echo "Dependencies saved to requirements.txt"

echo "Backend setup complete!"
