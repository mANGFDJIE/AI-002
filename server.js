const express = require('express');
const session = require('express-session');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const OpenAI = require('openai');

const app = express();
const PORT = 5000;

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://127.0.0.1:11434';
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

app.use(express.json({ limit: '8mb' }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

const groq = GROQ_API_KEY ? new OpenAI({ baseURL: GROQ_BASE_URL, apiKey: GROQ_API_KEY }) : null;
const ollama = new OpenAI({ baseURL: `${OLLAMA_HOST}/v1`, apiKey: 'ollama' });
const openrouter = OPENROUTER_API_KEY ? new OpenAI({ baseURL: OPENROUTER_BASE_URL, apiKey: OPENROUTER_API_KEY }) : null;

const chats = {};

const freeModelPresets = {
  auto: { name: 'Авто', label: 'Авто', provider: 'groq', model: 'auto', color: 'auto', desc: 'Автоподбор бесплатной open-source модели', free: true },
  llama31_70b: { name: 'Llama 3.1 70B', label: 'Llama 3.1 70B', provider: 'groq', model: 'llama-3.1-70b-versatile', color: 'pro', desc: 'Мощная open-source модель от Meta', free: true },
  llama31_8b: { name: 'Llama 3.1 8B', label: 'Llama 3.1 8B', provider: 'groq', model: 'llama-3.1-8b-instant', color: 'economy', desc: 'Быстрая и дешевая для простых задач', free: true },
  llama32_3b: { name: 'Llama 3.2 3B', label: 'Llama 3.2 3B', provider: 'groq', model: 'llama-3.2-3b-preview', color: 'economy', desc: 'Легкая модель для быстрых ответов', free: true },
  llama32_1b: { name: 'Llama 3.2 1B', label: 'Llama 3.2 1B', provider: 'groq', model: 'llama-3.2-1b-preview', color: 'economy', desc: 'Самая легкая open-source модель', free: true },
  mixtral: { name: 'Mixtral 8x7B', label: 'Mixtral 8x7B', provider: 'groq', model: 'mixtral-8x7b-32768', color: 'standard', desc: 'Хороший баланс для кода и анализа', free: true },
  gemma2: { name: 'Gemma 2 9B', label: 'Gemma 2 9B', provider: 'groq', model: 'gemma2-9b-it', color: 'standard', desc: 'Open-source модель от Google', free: true }
};

const ollamaPresets = {
  llama3: { name: 'Ollama: Llama 3', label: 'Ollama Llama 3', provider: 'ollama', model: 'llama3', color: 'standard', desc: 'Локальная модель', free: true },
  qwen: { name: 'Ollama: Qwen 2.5', label: 'Ollama Qwen 2.5', provider: 'ollama', model: 'qwen2.5', color: 'standard', desc: 'Локальная модель', free: true },
  mistral: { name: 'Ollama: Mistral', label: 'Ollama Mistral', provider: 'ollama', model: 'mistral', color: 'standard', desc: 'Локальная модель', free: true }
};

const paidFallbacks = {
  gpt4o: { name: 'GPT-4o (OpenRouter)', label: 'GPT-4o', provider: 'openrouter', model: 'openai/gpt-4o', color: 'standard', desc: 'Требует кредитов OpenRouter', free: false },
  claudeSonnet: { name: 'Claude 3.5 Sonnet (OpenRouter)', label: 'Claude 3.5 Sonnet', provider: 'openrouter', model: 'anthropic/claude-3.5-sonnet', color: 'pro', desc: 'Требует кредитов OpenRouter', free: false }
};

function buildModelPresets() {
  const presets = { ...freeModelPresets };
  if (GROQ_API_KEY) {
    // free models already included
  }
  if (process.env.OLLAMA_HOST) {
    Object.assign(presets, ollamaPresets);
  }
  if (OPENROUTER_API_KEY) {
    Object.assign(presets, paidFallbacks);
  }
  return presets;
}

function getProvider(preset) {
  if (preset.provider === 'groq') return groq;
  if (preset.provider === 'ollama') return ollama;
  if (preset.provider === 'openrouter') return openrouter;
  return groq;
}

function modelSelector(content, mode) {
  const presets = buildModelPresets();
  if (mode && mode !== 'auto' && presets[mode]) return presets[mode];
  const c = content.toLowerCase();
  const isCode = /(код|напиши|создай|сделай|debug|ошибк|функция|скрипт|html|css|js|python|react|api|json|sql)/.test(c);
  const isComplex = /(анализ|почему|объясни|план|архитектура|оптимиз|рефактор|сравни|рассужд|докажи|система|дизайн)/.test(c) || c.length > 800;
  const isSimple = c.length < 120 && !isCode && !isComplex;

  if (isComplex && isCode) return presets.llama31_70b || presets.mixtral || presets.auto;
  if (isCode) return presets.mixtral || presets.llama31_8b || presets.auto;
  if (isComplex) return presets.llama31_70b || presets.mixtral || presets.auto;
  if (isSimple) return presets.llama32_1b || presets.llama32_3b || presets.auto;
  return presets.llama31_8b || presets.auto;
}

app.get('/api/config', (req, res) => {
  const hasGroq = !!GROQ_API_KEY;
  const hasOllama = !!process.env.OLLAMA_HOST;
  const hasOpenRouter = !!OPENROUTER_API_KEY;
  res.json({
    hasGroq,
    hasOllama,
    hasOpenRouter,
    activeProvider: hasGroq ? 'groq' : (hasOllama ? 'ollama' : 'none'),
    presets: buildModelPresets(),
    freeOnly: true
  });
});

app.get('/api/messages', (req, res) => {
  const sid = req.session.id;
  res.json(chats[sid] || []);
});

app.post('/api/messages', async (req, res) => {
  const sid = req.session.id;
  const { content, model = 'auto' } = req.body;
  if (!content || !content.trim()) return res.status(400).json({ error: 'Пустое сообщение' });

  const presets = buildModelPresets();
  const preset = modelSelector(content.trim(), model === 'auto' ? 'auto' : model);
  const client = getProvider(preset);

  if (!client && preset.provider !== 'ollama') {
    return res.status(503).json({ error: 'Нет подключенного провайдера. Добавьте GROQ_API_KEY или OLLAMA_HOST.' });
  }

  if (!chats[sid]) chats[sid] = [];
  const userMsg = { id: uuidv4(), role: 'user', content: content.trim(), ts: Date.now() };
  chats[sid].push(userMsg);

  const thinkingId = uuidv4();
  const replyId = uuidv4();

  res.json({ userMsg, thinkingId, replyId, model: preset.name });

  try {
    const messages = chats[sid].filter(m => m.role === 'user' || m.role === 'assistant').slice(-20).map(m => ({ role: m.role, content: m.content }));
    const start = Date.now();

    let completion;
    if (preset.provider === 'ollama') {
      completion = await ollama.chat.completions.create({
        model: preset.model,
        messages: [
          { role: 'system', content: 'Вы — полезный AI-агент. Отвечайте на русском языке, если запрос на русском.' },
          ...messages
        ],
        temperature: 0.7,
        max_tokens: 4000
      });
    } else {
      completion = await client.chat.completions.create({
        model: preset.model,
        messages: [
          { role: 'system', content: 'Вы — полноценный автономный AI-агент. Вы умеете писать, редактировать, анализировать код, строить планы, объяснять и выполнять задачи пользователя. Отвечайте на русском языке, если запрос на русском. Будьте конкретны и полезны.' },
          ...messages
        ],
        temperature: 0.7,
        max_tokens: 4000
      });
    }

    const elapsed = Math.max(1, Math.round((Date.now() - start) / 1000));
    const reply = {
      id: replyId,
      role: 'assistant',
      content: completion.choices[0].message.content,
      ts: Date.now(),
      worked: elapsed,
      model: preset.name
    };
    chats[sid].push(reply);
  } catch (err) {
    const errorMsg = err.message || 'неизвестная ошибка';
    const reply = {
      id: replyId,
      role: 'assistant',
      content: `Ошибка модели: ${errorMsg}`,
      ts: Date.now(),
      worked: 0,
      model: preset.name,
      error: true
    };
    chats[sid].push(reply);
  }
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
