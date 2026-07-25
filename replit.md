# Agent UI

An AI chat interface (Russian-language) that routes messages to free open-source models via OpenRouter. Includes a live code preview pane that displays files the agent writes to the workspace.

## Stack

- **Backend:** Node.js + Express (`server.js`), port 5000
- **Frontend:** Vanilla HTML/CSS/JS in `public/`
- **LLM provider:** OpenRouter (free-tier models: GPT-OSS 20B, Nemotron 120B, Gemma 4 31B, North Mini Code)
- **Sessions:** `express-session` (in-memory, per-process)

## How to run

The workflow `Start application` runs `node server.js`. Dependencies are installed via `npm install`.

## Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `SESSION_SECRET` | Yes (set) | Express session signing |
| `OPENROUTER_API_KEY` | Yes (not set) | LLM API access via OpenRouter |
| `GROQ_API_KEY` | No | Optional Groq provider |
| `OLLAMA_HOST` | No | Optional local Ollama instance |

To enable chat, add `OPENROUTER_API_KEY` in the Secrets tab. Get a free key at https://openrouter.ai.

## Key paths

- `server.js` — Express server, model routing, workspace file API
- `public/index.html` — main UI shell
- `public/app.js` — frontend logic
- `public/style.css` — dark-theme styles
- `workspace/preview/` — files written by the agent, served at `/preview/`

## User preferences

- Keep the existing Russian-language UI and project structure.
