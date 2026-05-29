#!/usr/bin/env bash
set -euo pipefail

apt update
apt install -y curl git python3-pip python3-venv

if ! command -v node >/dev/null 2>&1; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt install -y nodejs
fi

python3 -m venv "$HOME/gemma-venv"
source "$HOME/gemma-venv/bin/activate"
pip install --upgrade pip
pip install vllm huggingface_hub

npm install --omit=dev

echo "Setup complete. Run huggingface-cli login before starting Gemma if the model requires gated access."
