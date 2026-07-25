const express = require('express');
const session = require('express-session');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs').promises;
const OpenAI = require('openai');

const app = express();
const PORT = 5000;

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const OLLAMA_HOST = process.env.OLLAMA_HOST;

const WORKSPACE_DIR = path.join(__dirname, 'workspace', 'preview');

app.use(express.json({ limit: '8mb' }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/preview', express.static(WORKSPACE_DIR));
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

const openrouter = OPENROUTER_API_KEY ? new OpenAI({
  baseURL: OPENROUTER_BASE_URL,
  apiKey: OPENROUTER_API_KEY
}) : null;

const chats = {};

const openRouterModels = {
  auto: { name: 'Авто', label: 'Авто', provider: 'openrouter', model: 'openrouter/free', color: 'auto', desc: 'Автоподбор модели по задаче и сложности', fallbackModels: ['openai/gpt-oss-20b:free', 'nvidia/nemotron-3-super-120b-a12b:free', 'google/gemma-4-31b-it:free', 'cohere/north-mini-code:free'] },
  gptOss20b: { name: 'GPT-OSS 20B', label: 'GPT-OSS 20B', provider: 'openrouter', model: 'openai/gpt-oss-20b:free', color: 'standard', desc: 'OpenAI open-source — код и общие задачи', fallbackModels: ['openai/gpt-oss-20b', 'openrouter/free'] },
  nemotron120b: { name: 'Nemotron 3 Super 120B', label: 'Nemotron 120B', provider: 'openrouter', model: 'nvidia/nemotron-3-super-120b-a12b:free', color: 'pro', desc: 'NVIDIA — анализ и архитектура', fallbackModels: ['nvidia/nemotron-3-super-120b-a12b', 'openrouter/free'] },
  gemma4_31b: { name: 'Gemma 4 31B', label: 'Gemma 4 31B', provider: 'openrouter', model: 'google/gemma-4-31b-it:free', color: 'standard', desc: 'Google — UI-дизайн и генерация', fallbackModels: ['google/gemma-4-31b-it', 'openrouter/free'] },
  northMiniCode: { name: 'North Mini Code', label: 'North Mini Code', provider: 'openrouter', model: 'cohere/north-mini-code:free', color: 'economy', desc: 'Cohere — отладка и фиксы', fallbackModels: ['cohere/north-mini-code', 'openrouter/free'] }
};

function getTaskType(content) {
  const c = content.toLowerCase();
  if (/(ui|дизайн|css|html|верстка|интерфейс|макет|figma|tailwind|стиль|оформление|внешний вид|layout|grid|flex|color|цвет|шрифт|font)/.test(c)) return 'ui';
  if (/(debug|ошибк|исправь|fix|баг|stack trace|traceback|console|error|не работает|падает|почему не|broken|fail|exception)/.test(c)) return 'debug';
  if (/(анализ|архитектура|план|система|объясни|почему|сравни|оптимизация|рефактор|докажи|рассужд|выбор технолог|trade-off|против|плюсы минусы)/.test(c) || c.length > 900) return 'analysis';
  if (/(код|напиши|создай|сделай|функция|скрипт|api|python|js|javascript|react|node|sql|json|endpoint|route|handler|component|class|library|модуль|пакет|npm|install|write|generate)/.test(c)) return 'code';
  return 'general';
}

function getComplexity(content) {
  const len = content.length;
  if (len < 150) return 'simple';
  if (len < 600) return 'medium';
  if (/(архитектура|система|проект|приложение|много|несколько|микросервис|полноценный|с нуля|full|complete|complex|большой)/.test(content.toLowerCase())) return 'complex';
  return 'medium';
}

function selectModelByTask(content) {
  const taskType = getTaskType(content);
  const complexity = getComplexity(content);

  // Task-specific routing
  if (taskType === 'ui') return openRouterModels.gemma4_31b;
  if (taskType === 'debug') return openRouterModels.northMiniCode;
  if (taskType === 'analysis') {
    return complexity === 'complex' ? openRouterModels.nemotron120b : openRouterModels.gptOss20b;
  }
  if (taskType === 'code') {
    if (complexity === 'complex') return openRouterModels.nemotron120b;
    if (complexity === 'medium') return openRouterModels.gptOss20b;
    return openRouterModels.northMiniCode;
  }
  // General
  if (complexity === 'simple') return openRouterModels.northMiniCode;
  if (complexity === 'complex') return openRouterModels.nemotron120b;
  return openRouterModels.gptOss20b;
}

function modelSelector(content, mode) {
  if (mode && mode !== 'auto') return openRouterModels[mode] || openRouterModels.gptOss20b;
  return selectModelByTask(content);
}

function isRetryableError(err) {
  const msg = (err.message || '').toLowerCase();
  const status = err.status || err.statusCode || 0;
  // Retry on credits, rate limits, provider overloads, server errors
  if ([402, 429, 500, 502, 503, 504].includes(status)) return true;
  if (msg.includes('insufficient credits') || msg.includes('credits') || msg.includes('payment') || msg.includes('purchase')) return true;
  if (msg.includes('rate limit') || msg.includes('provider returned error') || msg.includes('too many requests')) return true;
  if (msg.includes('overloaded') || msg.includes('server error') || msg.includes('bad gateway') || msg.includes('unavailable')) return true;
  return false;
}

app.get('/api/config', (req, res) => {
  res.json({
    mode: 'openrouter',
    hasOpenRouter: !!OPENROUTER_API_KEY,
    hasGroq: !!GROQ_API_KEY,
    hasOllama: !!OLLAMA_HOST,
    presets: openRouterModels
  });
});

app.get('/api/messages', (req, res) => {
  const sid = req.session.id;
  res.json(chats[sid] || []);
});

app.post('/api/messages', async (req, res) => {
  if (!OPENROUTER_API_KEY) return res.status(503).json({ error: 'OPENROUTER_API_KEY не настроен' });
  const sid = req.session.id;
  const { content, model = 'auto' } = req.body;
  if (!content || !content.trim()) return res.status(400).json({ error: 'Пустое сообщение' });

  if (!chats[sid]) chats[sid] = [];
  const userMsg = { id: uuidv4(), role: 'user', content: content.trim(), ts: Date.now() };
  chats[sid].push(userMsg);

  const preset = modelSelector(content.trim(), model === 'auto' ? 'auto' : model);
  const thinkingId = uuidv4();
  const replyId = uuidv4();

  res.json({ userMsg, thinkingId, replyId, model: preset.name });

  const history = chats[sid].filter(m => m.role === 'user' || m.role === 'assistant').slice(-20).map(m => ({ role: m.role, content: m.content }));
  const messages = [
    { role: 'system', content: 'Вы — полноценный автономный AI-агент. Умеете писать и редактировать код, анализировать, проектировать, объяснять. Когда вы даёте код для файлов, помечайте каждый блок комментарием с путём: `// file: path/to/file.ext` или `<!-- file: path/to/file.ext -->` в первой строке. Отвечайте на русском языке, если запрос на русском. Будьте конкретны и полезны.' },
    ...history
  ];

  const start = Date.now();
  let usedModel = preset.name;
  let usedModelId = preset.model;
  let fallbackUsed = false;
  let finalContent = '';
  let error = false;

  try {
    const candidates = [preset.model, ...(preset.fallbackModels || [])];
    let result = null;

    for (let i = 0; i < candidates.length; i++) {
      try {
        const completion = await openrouter.chat.completions.create({
          model: candidates[i],
          messages,
          temperature: 0.7,
          max_tokens: 4000
        });
        result = { completion, modelId: candidates[i], fallback: i > 0 };
        break;
      } catch (err) {
        if (!isRetryableError(err) && i === candidates.length - 1) throw err;
        if (!isRetryableError(err)) throw err;
      }
    }

    if (!result) throw new Error('Ни одна модель не ответила');

    usedModelId = result.modelId;
    fallbackUsed = result.fallback;

    const found = Object.values(openRouterModels).find(m => m.model === usedModelId || (m.fallbackModels || []).includes(usedModelId));
    usedModel = found ? found.name : usedModelId;
    if (fallbackUsed) usedModel += ' (fallback)';

    finalContent = result.completion.choices[0].message.content;
  } catch (err) {
    error = true;
    finalContent = `Ошибка модели: ${err.message || 'неизвестная ошибка'}`;
  }

  const elapsed = Math.max(1, Math.round((Date.now() - start) / 1000));
  const reply = {
    id: replyId,
    role: 'assistant',
    content: finalContent,
    ts: Date.now(),
    worked: elapsed,
    model: usedModel,
    error
  };
  chats[sid].push(reply);
});

app.get('/api/messages/:id', (req, res) => {
  const sid = req.session.id;
  const msg = (chats[sid] || []).find(m => m.id === req.params.id);
  if (msg) return res.json(msg);
  res.status(404).json({ pending: true });
});

app.delete('/api/messages', (req, res) => {
  const sid = req.session.id;
  chats[sid] = [];
  res.json({ ok: true });
});

// ── Workspace / Preview ─────────────────────────────────
app.get('/api/workspace/files', async (req, res) => {
  try {
    const files = await listWorkspaceFiles(WORKSPACE_DIR);
    res.json({ files });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/workspace/read', async (req, res) => {
  const filePath = sanitizePath(req.query.path);
  if (!filePath) return res.status(400).json({ error: 'Нет пути' });
  try {
    const fullPath = path.join(WORKSPACE_DIR, filePath);
    const content = await fs.readFile(fullPath, 'utf8');
    res.json({ content });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/workspace/write', async (req, res) => {
  const { path: filePath, content } = req.body;
  const safePath = sanitizePath(filePath);
  if (!safePath) return res.status(400).json({ error: 'Некорректный путь' });
  try {
    const fullPath = path.join(WORKSPACE_DIR, safePath);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, content, 'utf8');
    res.json({ ok: true, path: safePath });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/apply-code', async (req, res) => {
  const { changes } = req.body;
  if (!Array.isArray(changes) || changes.length === 0) return res.status(400).json({ error: 'Нет изменений' });
  const applied = [];
  const errors = [];
  for (const ch of changes) {
    const safePath = sanitizePath(ch.path);
    if (!safePath) { errors.push({ path: ch.path, error: 'Некорректный путь' }); continue; }
    try {
      const fullPath = path.join(WORKSPACE_DIR, safePath);
      await fs.mkdir(path.dirname(fullPath), { recursive: true });
      await fs.writeFile(fullPath, ch.content, 'utf8');
      applied.push(safePath);
    } catch (err) {
      errors.push({ path: ch.path, error: err.message });
    }
  }
  res.json({ applied, errors, count: applied.length });
});

app.post('/api/workspace/clear', async (req, res) => {
  try {
    await clearWorkspace(WORKSPACE_DIR);
    await fs.mkdir(WORKSPACE_DIR, { recursive: true });
    await fs.writeFile(path.join(WORKSPACE_DIR, 'index.html'), defaultIndexHtml(), 'utf8');
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

async function listWorkspaceFiles(dir, base = '') {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  let files = [];
  for (const entry of entries) {
    const relativePath = base ? `${base}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      const subFiles = await listWorkspaceFiles(path.join(dir, entry.name), relativePath);
      files = files.concat(subFiles);
    } else {
      files.push(relativePath);
    }
  }
  return files;
}

async function clearWorkspace(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await clearWorkspace(fullPath);
      await fs.rmdir(fullPath).catch(() => {});
    } else {
      await fs.unlink(fullPath).catch(() => {});
    }
  }
}

function sanitizePath(p) {
  if (!p || typeof p !== 'string') return null;
  const normalized = path.normalize(p).replace(/^(\.\.(\/|\$))+/, '');
  if (normalized.startsWith('..') || path.isAbsolute(normalized)) return null;
  return normalized;
}

function defaultIndexHtml() {
  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <title>Превью</title>
  <style>
    body { font-family: system-ui, sans-serif; background: #0e0f13; color: #d4d6e0; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
    .start { text-align: center; }
    h1 { font-size: 24px; margin-bottom: 10px; }
    p { color: #8890aa; }
  </style>
</head>
<body>
  <div class="start">
    <h1>Здесь будет превью</h1>
    <p>Попросите агента создать или изменить проект</p>
  </div>
</body>
</html>`;
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});
