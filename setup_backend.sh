#!/bin/bash

set -e

echo "Setting up Backend Environment (pyenv + pyenv-virtualenv)..."

cd localbite-backend

# Ensure pyenv exists
if ! command -v pyenv &> /dev/null; then
    echo "pyenv not found. Please install pyenv first."
    exit 1
fi

# Desired Python version & virtualenv name
PYTHON_VERSION="3.13"
VENV_NAME="localbite-backend"

# Install Python version if missing
# if pyenv versions --bare | grep -qx "${PYTHON_VERSION}"; then
#     echo "Python ${PYTHON_VERSION} already installed."
# else
#     echo "Installing Python ${PYTHON_VERSION}..."
#     pyenv install ${PYTHON_VERSION}
# fi

# Create virtualenv if missing
if pyenv virtualenvs --bare | grep -qx "${VENV_NAME}"; then
    echo "Virtualenv '${VENV_NAME}' already exists."
else
    echo "Creating virtualenv '${VENV_NAME}'..."
    pyenv virtualenv ${PYTHON_VERSION} ${VENV_NAME}
fi

# Activate via local version
pyenv local ${VENV_NAME}

# Refresh shims
pyenv rehash

# Upgrade pip
echo "Upgrading pip..."
pip install --upgrade pip

# Install dependencies
echo "Installing Python modules..."
pip install fastapi "uvicorn[standard]" python-dotenv

# Freeze dependencies
pip freeze > requirements.txt
echo "Dependencies saved to requirements.txt"

echo "Backend setup complete!"