const express = require('express');
const session = require('express-session');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const OpenAI = require('openai');

const app = express();
const PORT = 5000;

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

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
const modelPresets = {
  auto: { name: 'Авто', label: 'Авто', provider: 'openrouter', model: 'auto', color: 'auto', desc: 'Автоподбор модели по задаче' },
  gpt4o: { name: 'GPT-4o', label: 'GPT-4o', provider: 'openrouter', model: 'openai/gpt-4o', color: 'standard', desc: 'Универсальная мультимодальная модель' },
  gpt4oMini: { name: 'GPT-4o mini', label: 'GPT-4o mini', provider: 'openrouter', model: 'openai/gpt-4o-mini', color: 'economy', desc: 'Быстрая и дешевая для простых задач' },
  claudeSonnet: { name: 'Claude 3.5 Sonnet', label: 'Claude 3.5 Sonnet', provider: 'openrouter', model: 'anthropic/claude-3.5-sonnet', color: 'pro', desc: 'Отличный код и анализ' },
  claudeOpus: { name: 'Claude 3 Opus', label: 'Claude 3 Opus', provider: 'openrouter', model: 'anthropic/claude-3-opus', color: 'pro', desc: 'Максимальная мощность' },
  o3Mini: { name: 'o3-mini', label: 'o3-mini', provider: 'openrouter', model: 'openai/o3-mini', color: 'pro', desc: 'Рассуждения и код' },
  deepseekChat: { name: 'DeepSeek V3', label: 'DeepSeek V3', provider: 'openrouter', model: 'deepseek/deepseek-chat', color: 'standard', desc: 'Мощная open-source модель' },
  deepseekCoder: { name: 'DeepSeek Coder', label: 'DeepSeek Coder', provider: 'openrouter', model: 'deepseek/deepseek-coder', color: 'pro', desc: 'Специализирована на код' },
  llama: { name: 'Llama 3.1 70B', label: 'Llama 3.1 70B', provider: 'openrouter', model: 'meta-llama/llama-3.1-70b-instruct', color: 'economy', desc: 'Open-source от Meta' },
  qwen: { name: 'Qwen 2.5 72B', label: 'Qwen 2.5 72B', provider: 'openrouter', model: 'qwen/qwen-2.5-72b-instruct', color: 'standard', desc: 'Отличный баланс цены/качества' }
};

function modelSelector(content, mode) {
  if (mode && mode !== 'auto') return modelPresets[mode] || modelPresets.gpt4o;
  const c = content.toLowerCase();
  const isCode = /(код|напиши|создай|сделай|debug|ошибк|функция|скрипт|html|css|js|python|react|api)/.test(c);
  const isComplex = /(анализ|почему|объясни|план|архитектура|оптимиз|рефактор|сравни|рассужд|докажи)/.test(c) || c.length > 800;
  const isSimple = c.length < 120 && !isCode && !isComplex;

  if (isComplex && isCode) return modelPresets.claudeOpus;
  if (isCode) return modelPresets.claudeSonnet;
  if (isComplex) return modelPresets.o3Mini;
  if (isSimple) return modelPresets.gpt4oMini;
  return modelPresets.gpt4o;
}

app.get('/api/config', (req, res) => {
  const hasKey = !!OPENROUTER_API_KEY;
  res.json({ hasKey, provider: 'openrouter', presets: modelPresets });
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

  try {
    const messages = chats[sid].filter(m => m.role === 'user' || m.role === 'assistant').slice(-20).map(m => ({ role: m.role, content: m.content }));
    const start = Date.now();
    const completion = await openrouter.chat.completions.create({
      model: preset.model,
      messages: [
        { role: 'system', content: 'Вы — полноценный автономный AI-агент. Вы умеете писать, редактировать, анализировать код, строить планы, объяснять и выполнять задачи пользователя. Отвечайте на русском языке, если запрос на русском. Будьте конкретны и полезны.' },
        ...messages
      ],
      temperature: 0.7,
      max_tokens: 4000
    });
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
    const reply = {
      id: replyId,
      role: 'assistant',
      content: `Ошибка модели: ${err.message || 'неизвестная ошибка'}`,
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

app.post('/api/execute', async (req, res) => {
  if (!OPENROUTER_API_KEY) return res.status(503).json({ error: 'OPENROUTER_API_KEY не настроен' });
  const { instruction, model = 'auto', context = '' } = req.body;
  const preset = modelSelector(instruction || '', model === 'auto' ? 'auto' : model);
  try {
    const completion = await openrouter.chat.completions.create({
      model: preset.model,
      messages: [
        { role: 'system', content: 'Вы — агент, выполняющий задачи. Можете генерировать JSON, код, планы, анализ. Отвечайте на русском.' },
        { role: 'user', content: `Контекст: ${context}\n\nЗадача: ${instruction}` }
      ],
      temperature: 0.3,
      max_tokens: 4000
    });
    res.json({ result: completion.choices[0].message.content, model: preset.name });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Ошибка' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});
