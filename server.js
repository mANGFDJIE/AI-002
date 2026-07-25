const express = require('express');
const session = require('express-session');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const OpenAI = require('openai');

const app = express();
const PORT = 5000;

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const OLLAMA_HOST = process.env.OLLAMA_HOST;

app.use(express.json({ limit: '8mb' }));
app.use(express.static(path.join(__dirname, 'public')));
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

const openRouterFreeModels = {
  auto: { name: 'Free Router', label: 'Free Router', provider: 'openrouter', model: 'openrouter/free', color: 'auto', desc: 'Авто-выбор лучшей свободной модели', fallbackModels: ['openai/gpt-oss-20b:free', 'nvidia/nemotron-3-super-120b-a12b:free', 'google/gemma-4-31b-it:free', 'cohere/north-mini-code:free'] },
  gptOss20b: { name: 'GPT-OSS 20B', label: 'GPT-OSS 20B', provider: 'openrouter', model: 'openai/gpt-oss-20b:free', color: 'standard', desc: 'OpenAI open-source — код и общие задачи', fallbackModels: ['openai/gpt-oss-20b', 'openrouter/free'] },
  nemotron120b: { name: 'Nemotron 3 Super 120B', label: 'Nemotron 120B', provider: 'openrouter', model: 'nvidia/nemotron-3-super-120b-a12b:free', color: 'pro', desc: 'NVIDIA — анализ и архитектура', fallbackModels: ['nvidia/nemotron-3-super-120b-a12b', 'openrouter/free'] },
  gemma4_31b: { name: 'Gemma 4 31B', label: 'Gemma 4 31B', provider: 'openrouter', model: 'google/gemma-4-31b-it:free', color: 'standard', desc: 'Google — UI-дизайн и генерация', fallbackModels: ['google/gemma-4-31b-it', 'openrouter/free'] },
  northMiniCode: { name: 'North Mini Code', label: 'North Mini Code', provider: 'openrouter', model: 'cohere/north-mini-code:free', color: 'economy', desc: 'Cohere — отладка и фиксы', fallbackModels: ['cohere/north-mini-code', 'openrouter/free'] }
};

function getTaskType(content) {
  const c = content.toLowerCase();
  if (/(ui|дизайн|css|html|верстка|интерфейс|макет|figma|tailwind|стиль)/.test(c)) return 'ui';
  if (/(debug|ошибк|исправь|fix|баг|stack trace|traceback|console|error|не работает|падает)/.test(c)) return 'debug';
  if (/(анализ|архитектура|план|система|объясни|почему|сравни|оптимизация|рефактор|докажи|рассужд)/.test(c) || c.length > 900) return 'analysis';
  if (/(код|напиши|создай|сделай|функция|скрипт|api|python|js|react|node|sql|json|endpoint|route|handler|component)/.test(c)) return 'code';
  return 'general';
}

function selectModelByTask(taskType) {
  switch (taskType) {
    case 'ui': return openRouterFreeModels.gemma4_31b;
    case 'debug': return openRouterFreeModels.northMiniCode;
    case 'analysis': return openRouterFreeModels.nemotron120b;
    case 'code': return openRouterFreeModels.gptOss20b;
    default: return openRouterFreeModels.gptOss20b;
  }
}

function modelSelector(content, mode) {
  if (mode && mode !== 'auto') return openRouterFreeModels[mode] || openRouterFreeModels.gptOss20b;
  return selectModelByTask(getTaskType(content));
}

function isInsufficientCreditsError(err) {
  const msg = (err.message || '').toLowerCase();
  const status = err.status || err.statusCode || 0;
  return status === 402 || msg.includes('insufficient credits') || msg.includes('credits') || msg.includes('payment') || msg.includes('purchase');
}

async function tryGenerate(client, modelId, messages, maxRetries = 2) {
  let lastError = null;
  for (let i = 0; i <= maxRetries; i++) {
    try {
      const completion = await client.chat.completions.create({
        model: modelId,
        messages,
        temperature: 0.7,
        max_tokens: 4000
      });
      return { completion, modelId, fallback: i > 0 };
    } catch (err) {
      lastError = err;
      if (!isInsufficientCreditsError(err)) break;
    }
  }
  throw lastError;
}

app.get('/api/config', (req, res) => {
  res.json({
    mode: 'openrouter',
    hasOpenRouter: !!OPENROUTER_API_KEY,
    hasGroq: !!GROQ_API_KEY,
    hasOllama: !!OLLAMA_HOST,
    presets: openRouterFreeModels
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
    { role: 'system', content: 'Вы — полноценный автономный AI-агент. Умеете писать и редактировать код, анализировать, проектировать, объяснять. Отвечайте на русском языке, если запрос на русском. Будьте конкретны и полезны.' },
    ...history
  ];

  const start = Date.now();
  let usedModel = preset.name;
  let usedModelId = preset.model;
  let fallbackUsed = false;
  let finalContent = '';
  let error = false;

  try {
    // Try main model, then fallback chain
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
        if (!isInsufficientCreditsError(err) && i === candidates.length - 1) throw err;
        if (!isInsufficientCreditsError(err)) throw err;
      }
    }

    if (!result) throw new Error('Ни одна бесплатная модель не ответила');

    usedModelId = result.modelId;
    fallbackUsed = result.fallback;

    // Resolve display name
    const found = Object.values(openRouterFreeModels).find(m => m.model === usedModelId || (m.fallbackModels || []).includes(usedModelId));
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

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});
