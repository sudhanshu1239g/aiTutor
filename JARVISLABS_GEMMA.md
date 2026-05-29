# Deploy Interview AI Tutor with Gemma 4 Small on JarvisLabs

This project is configured for a self-hosted Gemma 4 small model through a vLLM OpenAI-compatible API.

Recommended model:

```bash
google/gemma-4-E4B-it
```

Lower VRAM fallback:

```bash
google/gemma-4-E2B-it
```

## What Runs Where

- Browser: speech recognition and text-to-speech
- Node app: static UI and `/api/tutor` proxy
- vLLM: Gemma 4 small chat completions endpoint
- JarvisLabs GPU: Node app and vLLM server

## 1. Create JarvisLabs Instance

Use an Ubuntu/PyTorch GPU template.

Suggested GPU:

- E4B: 16 GB VRAM or more
- E2B: 8 GB VRAM or more

## 2. Upload or Clone the Project

SSH into the instance:

```bash
ssh root@YOUR_JARVISLABS_HOST
```

Put the project on the machine. For example:

```bash
git clone YOUR_REPO_URL AiTutor
cd AiTutor
```

If you are not using git, upload this folder with `scp` or JarvisLabs file tools.

## 3. Run Setup

```bash
cd ~/AiTutor
chmod +x scripts/jarvislabs/*.sh
./scripts/jarvislabs/setup.sh
```

Log in to Hugging Face and accept the Gemma model terms first if required:

```bash
source ~/gemma-venv/bin/activate
huggingface-cli login
```

## 4. Start Gemma 4 Small

Terminal 1:

```bash
cd ~/AiTutor
LLM_MODEL=google/gemma-4-E4B-it ./scripts/jarvislabs/start-gemma.sh
```

If the GPU runs out of memory:

```bash
LLM_MODEL=google/gemma-4-E2B-it MAX_MODEL_LEN=4096 ./scripts/jarvislabs/start-gemma.sh
```

## 5. Test Gemma on the Instance

Terminal 2:

```bash
curl http://127.0.0.1:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "google/gemma-4-E4B-it",
    "messages": [
      { "role": "system", "content": "You are an interview tutor." },
      { "role": "user", "content": "Ask one React interview question." }
    ],
    "temperature": 0.7
  }'
```

## 6. Start the Web App on JarvisLabs

Terminal 2:

```bash
cd ~/AiTutor
cp .env.example .env
./scripts/jarvislabs/start-app.sh
```

The app listens on:

```bash
http://YOUR_JARVISLABS_HOST:5173
```

If JarvisLabs does not expose port `5173`, use SSH tunneling from your local machine:

```bash
ssh -L 5173:127.0.0.1:5173 root@YOUR_JARVISLABS_HOST
```

Then open:

```bash
http://127.0.0.1:5173
```

## Environment

The Gemma deployment uses:

```bash
LLM_API_KEY=
LLM_BASE_URL=http://127.0.0.1:8000/v1/chat/completions
LLM_MODEL=google/gemma-4-E4B-it
HOST=0.0.0.0
PORT=5173
```

`LLM_API_KEY` can stay blank because local vLLM does not require one by default.

## Troubleshooting

- If Gemma fails to load, try `google/gemma-4-E2B-it`.
- If VRAM is still tight, set `MAX_MODEL_LEN=4096`.
- If the app opens but replies are fallback text, confirm vLLM is running on port `8000`.
- If the browser mic does not work over a public HTTP URL, use `localhost` via SSH tunnel. Browsers treat `localhost` as a secure context for microphone access.
