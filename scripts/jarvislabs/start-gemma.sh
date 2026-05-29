#!/usr/bin/env bash
set -euo pipefail

MODEL="${LLM_MODEL:-google/gemma-4-E4B-it}"
MAX_MODEL_LEN="${MAX_MODEL_LEN:-8192}"
PORT="${GEMMA_PORT:-8000}"

source "$HOME/gemma-venv/bin/activate"

vllm serve "$MODEL" \
  --host 0.0.0.0 \
  --port "$PORT" \
  --dtype bfloat16 \
  --max-model-len "$MAX_MODEL_LEN"
