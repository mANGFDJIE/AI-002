const express = require('express');
const session = require('express-session');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const OpenAI = require('openai');

const app = express();
const PORT = 5000;

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

app.use(express.json({ limit: '8mb' }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

const openai = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

const chats = {};
const modelPresets = {
  auto: { name: 'Авто', label: 'Авто', provider: 'openai', model: 'auto', color: 'auto', desc: 'Автоподбор модели по задаче' },
  gpt4o: { name: 'GPT-4o', label: 'GPT-4o', provider: 'openai', model: 'gpt-4o', color: 'standard', desc: 'Универсальная мультимодальная модель' },
  gpt4oMini: { name: 'GPT-4o mini', label: 'GPT-4o mini', provider: 'openai', model: 'gpt-4o-mini', color: 'economy', desc: 'Быстрая и дешевая для простых задач' },
  o3Mini: { name: 'o3-mini', label: 'o3-mini', provider: 'openai', model: 'o3-mini', color: 'pro', desc: 'Рассуждения, код, логика' },
  o1: { name: 'o1', label: 'o1', provider: 'openai', model: 'o1', color: 'pro', desc: 'Сложные задачи, научный анализ' },
  o1Mini: { name: 'o1-mini', label: 'o1-mini', provider: 'openai', model: 'o1-mini', color: 'pro', desc: 'Рассуждения быстрее и дешевле' }
};

function modelSelector(content, mode) {
  if (mode !== 'auto' && mode !== undefined) return modelPresets[mode] || modelPresets.gpt4o;
  const c = content.toLowerCase();
  const complexity = Math.min(1, c.length / 4000) + (c.includes('создай') || c.includes('сделай') || c.includes('напиши') || c.includes('код') || c.includes('debug') || c.includes('ошибка') ? 0.3 : 0) + (c.includes('анализ') || c.includes('почему') || c.includes('объясни') || c.includes('план') ? 0.2 : 0);
  if (complexity >= 0.6) return modelPresets.o3Mini;
  if (complexity >= 0.35) return modelPresets.gpt4o;
  return modelPresets.gpt4oMini;
}

app.get('/api/config', (req, res) => {
  res.json({ hasKey: !!OPENAI_API_KEY, presets: modelPresets });
});

app.get('/api/messages', (req, res) => {
  const sid = req.session.id;
  res.json(chats[sid] || []);
});

app.post('/api/messages', async (req, res) => {
  if (!OPENAI_API_KEY) return res.status(503).json({ error: 'OPENAI_API_KEY не настроен' });
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
    const completion = await openai.chat.completions.create({
      model: preset.model,
      messages: [
        { role: 'system', content: 'Вы — полноценный автономный AI-агент. Вы умеете писать, редактировать, анализировать код, строить планы, объяснять и выполнять задачи пользователя. Отвечайте на русском языке, если запрос на русском. Будьте конкретны, не отклоняйтесь от темы.' },
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
  if (!OPENAI_API_KEY) return res.status(503).json({ error: 'OPENAI_API_KEY не настроен' });
  const { instruction, model = 'auto', context = '' } = req.body;
  const preset = modelSelector(instruction || '', model === 'auto' ? 'auto' : model);
  try {
    const completion = await openai.chat.completions.create({
      model: preset.model,
      messages: [
        { role: 'system', content: 'Вы — агент, выполняющий задачи. Вы можете генерировать JSON, код, планы, анализ. Отвечайте на русском.' },
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
