# 🎙️ Voice Interview Tutor

[![Vercel Deployment](https://img.shields.io/badge/Vercel-Deployed-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://ai-tutor-eight-gamma.vercel.app)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![Made with Gemini](https://img.shields.io/badge/Built%20With-Gemini%202.5%20Flash-0061FF?style=for-the-badge&logo=google-gemini&logoColor=white)](https://deepmind.google/technologies/gemini/)

A voice-first, browser-native mock interview coach that conducts real-time technical interviews. It listens to your spoken answers and provides immediate, actionable feedback—all in the browser with zero installation required.

---

## What It Does

Practicing for technical interviews alone is awkward — you can study concepts, but you can't rehearse *speaking out loud* without another person. Voice Interview Tutor fills that gap. Pick a topic (React frontend, Node backend, fullstack, system design or data structures ), press Start, and the AI interviewer asks one question at a time, listens as you speak, gives brief coaching on your answer, then moves to the next question. The entire loop — question, answer, feedback — happens through voice.

---

## Why I Built This

---

I wanted to combine browser-native voice APIs with a modern LLM in a tight feedback loop. Interview prep was the right use case: the problem is real, the interaction is naturally conversational.

### 🌟 Key Features
*   **Zero-Latency Voice Loop:** Leverages browser-native speech recognition and synthesis for an instantaneous, conversational feel.
*   **Gemini 2.5 Flash Integration:** Powered by Google's high-speed, context-aware LLM via an OpenAI-compatible proxy layer.
*   **Context-Aware Coaching:** Dynamically adapts questions based on your previous answers while tracking conversational history.
*   **Zero Setup Required:** Fully deployed and optimized for immediate use in the browser.

---

## How to Run It

**Live demo:** deployed on Vercel — no setup needed, open and start speaking.
[![Vercel Deployment](https://img.shields.io/badge/Vercel-Deployed-black?style=for-the-badge&logo=vercel)](https://ai-tutor-eight-gamma.vercel.app)

> **Try it out:** No setup needed. Click the badge above to open the application and start speaking!

**Run locally:**

```bash
git clone <repo-url> && cd voice-interview-tutor
cp .env.example .env
# Add your Gemini API key and set LLM_BASE_URL + LLM_MODEL in .env
npm run dev
```

Open `http://localhost:5173`.

**Environment variables:**

| Variable | Value |
|---|---|
| `LLM_API_KEY` | Your Gemini API key |
| `LLM_BASE_URL` | Gemini OpenAI-compatible endpoint |
| `LLM_MODEL` | `gemini-2.5-flash` |
| `PORT` | `5173` (default) |

> The server also supports any other OpenAI-compatible endpoint — swap `LLM_BASE_URL` and `LLM_MODEL` to point at a different provider with no other changes.

## Architecture Decisions


**Web Speech API for voice input and output, not a cloud service.**
Browser-native speech recognition and synthesis are free, zero-latency, and require no extra API keys. The tradeoff is browser inconsistency — Chrome has the best support; Safari and Firefox degrade gracefully to typed input. For a prototype exploring voice UX, native APIs were the right starting point before committing to a paid speech service.

**Conversation history capped at the last 10 messages.**
Sending the full session history on every request would grow costs and latency as the interview runs longer. Ten messages (five question-answer pairs) keeps enough context for the model to avoid repeating itself without hitting token limits.

**Fallback response when no LLM is configured.**
If `LLM_BASE_URL` is missing, the server returns a hardcoded coaching response instead of erroring. This lets you verify the UI and voice pipeline locally before you have an API key.

## What I Used AI for

**This project started from a template.** The core architecture — the Node server, static file serving, Web Speech API integration, and base UI — came from a starter. My contribution was wiring in the Gemini 2.5 Flash backend by adapting the LLM proxy to work with Google's OpenAI-compatible endpoint.

**What the template provided:** `server.js` structure, `app.js` voice loop, HTML/CSS layout, the `/api/tutor` route shape, and the JarvisLabs self-hosting docs.

**What I changed:** swapped the LLM backend to Gemini 2.5 Flash, configured the Vercel deployment, and validated that the full voice loop worked end-to-end in a hosted environment.


## What I would change with 4 more weeks, imagine shipping this to real users.

**Structured per-answer feedback.** Right now coaching is freeform. A visible score on dimensions like clarity, specificity, and use of examples — updated after each answer — would make progress legible and give users something concrete to improve.

**Session history.** Conversations vanish on refresh. Persisting sessions would let users spot patterns in what they get wrong across multiple practice runs, which is where the real learning happens.

**Mobile voice UX.** iOS Safari doesn't support `continuous` speech recognition, so the current always-on mic doesn't work on iPhone. A push-to-talk model would make the app usable on mobile, where people actually do last-minute prep.

**Targeted question banks.** The LLM generates plausible questions but has no awareness of what specific companies actually ask. Seeding it with role- and company-specific patterns would make practice feel more like the real thing.
