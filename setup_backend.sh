#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/localbite-backend"
PYTHON_VERSION="${PYTHON_VERSION:-3.13.0}"
PYENV_ENV_NAME="${PYENV_ENV_NAME:-localbite-backend}"

command_exists() {
  command -v "$1" >/dev/null 2>&1
}

init_pyenv_shell() {
  export PYENV_ROOT="${PYENV_ROOT:-$HOME/.pyenv}"

  if command_exists brew; then
    local brew_pyenv_prefix=""
    brew_pyenv_prefix="$(brew --prefix pyenv 2>/dev/null || true)"
    if [[ -n "$brew_pyenv_prefix" ]]; then
      export PATH="$brew_pyenv_prefix/bin:$PATH"
    fi
  fi

  export PATH="$PYENV_ROOT/bin:$PATH"

  if command_exists pyenv; then
    eval "$(pyenv init -)"
    if pyenv commands | grep -qx "virtualenv-init"; then
      eval "$(pyenv virtualenv-init -)"
    fi
  fi
}

install_pyenv_if_missing() {
  if command_exists pyenv; then
    echo "pyenv already installed."
    return 0
  fi

  echo "pyenv not found. Installing..."
  if command_exists brew; then
    brew install pyenv pyenv-virtualenv
    init_pyenv_shell
    return 0
  fi

  if command_exists apt-get; then
    sudo apt-get update
    sudo apt-get install -y \
      build-essential curl git libbz2-dev libffi-dev liblzma-dev libncurses5-dev \
      libncursesw5-dev libreadline-dev libsqlite3-dev libssl-dev make tk-dev \
      wget xz-utils zlib1g-dev

    export PYENV_ROOT="${PYENV_ROOT:-$HOME/.pyenv}"
    if [[ ! -d "$PYENV_ROOT" ]]; then
      git clone https://github.com/pyenv/pyenv.git "$PYENV_ROOT"
    fi
    if [[ ! -d "$PYENV_ROOT/plugins/pyenv-virtualenv" ]]; then
      git clone https://github.com/pyenv/pyenv-virtualenv.git \
        "$PYENV_ROOT/plugins/pyenv-virtualenv"
    fi
    init_pyenv_shell
    return 0
  fi

  echo "Unable to install pyenv automatically (requires Homebrew or apt-get)." >&2
  exit 1
}

ensure_pyenv_virtualenv() {
  init_pyenv_shell
  if ! command_exists pyenv; then
    echo "pyenv is not available after installation." >&2
    exit 1
  fi

  if pyenv commands | grep -qx "virtualenv"; then
    echo "pyenv-virtualenv already available."
    return 0
  fi

  echo "pyenv-virtualenv not found. Installing..."
  if command_exists brew; then
    brew install pyenv-virtualenv
  else
    export PYENV_ROOT="${PYENV_ROOT:-$HOME/.pyenv}"
    mkdir -p "$PYENV_ROOT/plugins"
    git clone https://github.com/pyenv/pyenv-virtualenv.git \
      "$PYENV_ROOT/plugins/pyenv-virtualenv"
  fi
  init_pyenv_shell

  if ! pyenv commands | grep -qx "virtualenv"; then
    echo "pyenv-virtualenv installation failed." >&2
    exit 1
  fi
}

install_redis_if_missing() {
  if command_exists redis-server && command_exists redis-cli; then
    echo "Redis already installed."
    return 0
  fi

  echo "Redis not found. Installing..."
  if command_exists brew; then
    brew install redis
    return 0
  fi

  if command_exists apt-get; then
    sudo apt-get update
    sudo apt-get install -y redis-server
    return 0
  fi

  echo "Unable to install Redis automatically (requires Homebrew or apt-get)." >&2
  exit 1
}

create_or_reuse_backend_env() {
  init_pyenv_shell

  if pyenv versions --bare | grep -qx "$PYTHON_VERSION"; then
    echo "Python $PYTHON_VERSION already installed in pyenv."
  else
    echo "Installing Python $PYTHON_VERSION via pyenv..."
    pyenv install "$PYTHON_VERSION"
  fi

  if pyenv virtualenvs --bare | grep -qx "$PYENV_ENV_NAME"; then
    echo "pyenv virtualenv '$PYENV_ENV_NAME' already exists."
  else
    echo "Creating pyenv virtualenv '$PYENV_ENV_NAME'..."
    pyenv virtualenv "$PYTHON_VERSION" "$PYENV_ENV_NAME"
  fi

  cd "$BACKEND_DIR"
  pyenv local "$PYENV_ENV_NAME"
  pyenv rehash

  echo "Using backend Python: $(pyenv exec python -V 2>&1)"
  pyenv exec python -m pip install --upgrade pip

  if [[ -f "$BACKEND_DIR/requirements.txt" ]]; then
    echo "Installing backend dependencies from requirements.txt..."
    pyenv exec python -m pip install -r "$BACKEND_DIR/requirements.txt"
  else
    echo "No requirements.txt found in $BACKEND_DIR" >&2
    exit 1
  fi
}

echo "==> Localbite backend setup"
echo "Workspace: $ROOT_DIR"
echo "Backend:   $BACKEND_DIR"

install_pyenv_if_missing
ensure_pyenv_virtualenv
install_redis_if_missing
create_or_reuse_backend_env

echo
echo "Backend setup complete."
echo "Next step: ./deploy_backend.sh"
