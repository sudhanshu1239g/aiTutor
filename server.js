import http from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, "public");
const port = Number(process.env.PORT || 5173);
const host = process.env.HOST || "127.0.0.1";

loadEnv(path.join(__dirname, ".env"));

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon"
};

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);

    if (req.method === "POST" && url.pathname === "/api/tutor") {
      await handleTutor(req, res);
      return;
    }

    const requestedPath = url.pathname === "/" ? "/index.html" : url.pathname;
    const safePath = path.normalize(requestedPath).replace(/^(\.\.[/\\])+/, "");
    const filePath = path.join(publicDir, safePath);

    if (!filePath.startsWith(publicDir)) {
      send(res, 403, "Forbidden", "text/plain; charset=utf-8");
      return;
    }

    const data = await readFile(filePath);
    send(res, 200, data, mimeTypes[path.extname(filePath)] || "application/octet-stream");
  } catch (error) {
    if (error.code === "ENOENT") {
      send(res, 404, "Not found", "text/plain; charset=utf-8");
      return;
    }

    console.error(error);
    sendJson(res, 500, { error: "Something went wrong." });
  }
});

server.listen(port, host, () => {
  console.log(`Voice Interview Tutor running at http://${host}:${port}`);
});

async function handleTutor(req, res) {
  const payload = await readJson(req);
  const apiKey = process.env.LLM_API_KEY?.trim();
  const baseUrl = process.env.LLM_BASE_URL?.trim();
  const model = process.env.LLM_MODEL?.trim() || "google/gemma-4-E4B-it";

  if (!baseUrl) {
    sendJson(res, 200, fallbackTutorResponse(payload));
    return;
  }

  const messages = [
    {
      role: "system",
      content:
        "You are a sharp, encouraging interview prep voice tutor. Keep replies short enough to speak aloud. Ask one question at a time. If the candidate answered, give brief feedback and ask the next question."
    },
    ...normalizeMessages(payload.messages),
    {
      role: "user",
      content: buildTutorPrompt(payload)
    }
  ];

  const headers = {
    "Content-Type": "application/json"
  };

  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`;
  }

  const llmRes = await fetch(baseUrl, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.65
    })
  });

  if (!llmRes.ok) {
    const detail = await llmRes.text();
    sendJson(res, 502, { error: "LLM request failed.", detail });
    return;
  }

  const data = await llmRes.json();
  const reply = extractReply(data);
  sendJson(res, 200, { reply });
}

function fallbackTutorResponse(payload) {
  const answer = payload.answer || "";
  const stack = payload.stack || "JavaScript";
  const answered = answer.trim().length > 0;

  if (!answered) {
    return {
      reply: `Let's practice ${stack}. First question: tell me about a recent project where you used ${stack}, and what technical decision you owned.`
    };
  }

  return {
    reply: `Good. Make that answer stronger by adding one specific tradeoff, one measurable result, and what you would improve next time. Next question: how would you debug a production issue in ${stack}?`
  };
}

function normalizeMessages(messages = []) {
  return messages
    .filter(message => message && typeof message.content === "string")
    .slice(-10)
    .map(message => ({
      role: message.role === "user" ? "user" : "assistant",
      content: message.content
    }));
}

function buildTutorPrompt(payload) {
  if (!payload.answer) {
    return `Start a mock interview for ${payload.stack}. Ask the first question only.`;
  }

  return `The candidate answered: "${payload.answer}". Give concise feedback, then ask the next ${payload.stack} interview question.`;
}

function extractReply(data) {
  const content =
    data.choices?.[0]?.message?.content ||
    data.candidates?.[0]?.content?.parts?.map(part => part.text).join("") ||
    data.candidates?.[0]?.content?.parts?.[0]?.text ||
    "Tell me more about your approach.";

  try {
    const parsed = JSON.parse(content);
    if (typeof parsed === "string") return parsed;
    if (typeof parsed?.reply === "string") return parsed.reply;
  } catch {
    // Plain text is the normal path for most models.
  }

  return content;
}

function loadEnv(filePath) {
  if (!existsSync(filePath)) return;

  const lines = readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const [key, ...rest] = trimmed.split("=");
    if (!process.env[key]) {
      process.env[key] = rest.join("=").replace(/^["']|["']$/g, "");
    }
  }
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", chunk => {
      body += chunk;
      if (body.length > 1_000_000) {
        req.destroy();
        reject(new Error("Request too large"));
      }
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

function sendJson(res, status, data) {
  send(res, status, JSON.stringify(data), "application/json; charset=utf-8");
}

function send(res, status, data, type) {
  res.writeHead(status, { "Content-Type": type });
  res.end(data);
}
