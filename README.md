# Voice Interview Tutor

A simple voice-first interview prep tutor:

1. Streaming ASR with the browser Web Speech API
2. LLM reasoning through a local Node proxy
3. TTS with browser speech synthesis

## Run

```bash
npm run dev
```

Open `http://localhost:5173`.

## Configure the LLM

Fill in `.env`:

```bash
LLM_API_KEY=
LLM_BASE_URL=https://api.openai.com/v1/chat/completions
LLM_MODEL=gpt-4o-mini
```

The UI is intentionally minimal: choose a topic, speak or type, and continue the interview as a voice chat.

## Self-host Gemma

See [JARVISLABS_GEMMA.md](./JARVISLABS_GEMMA.md) for steps to run a small Gemma 4 model on a JarvisLabs GPU instance with vLLM.
