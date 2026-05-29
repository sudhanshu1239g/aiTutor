#!/usr/bin/env bash
set -euo pipefail

export HOST="${HOST:-0.0.0.0}"
export PORT="${PORT:-5173}"
export LLM_API_KEY="${LLM_API_KEY:-}"
export LLM_BASE_URL="${LLM_BASE_URL:-http://127.0.0.1:8000/v1/chat/completions}"
export LLM_MODEL="${LLM_MODEL:-google/gemma-4-E4B-it}"

npm run start
