const express = require('express');
const session = require('express-session');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
const PORT = 5000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

// In-memory chat store: sessionId -> [{role, content, ts, status}]
const chats = {};

app.get('/api/messages', (req, res) => {
  const sid = req.session.id;
  res.json(chats[sid] || []);
});

app.post('/api/messages', (req, res) => {
  const sid = req.session.id;
  const { content } = req.body;
  if (!content || !content.trim()) return res.status(400).json({ error: 'Пустое сообщение' });

  if (!chats[sid]) chats[sid] = [];

  const userMsg = { id: uuidv4(), role: 'user', content: content.trim(), ts: Date.now() };
  chats[sid].push(userMsg);

  // Simulate assistant thinking
  const thinkingId = uuidv4();
  const replyId = uuidv4();

  res.json({ userMsg, thinkingId, replyId });

  // After a short delay, store the assistant reply
  const delay = 1200 + Math.random() * 800;
  setTimeout(() => {
    const reply = {
      id: replyId,
      role: 'assistant',
      content: generateReply(content.trim()),
      ts: Date.now(),
      worked: Math.round(delay / 1000)
    };
    chats[sid].push(reply);
  }, delay);
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

function generateReply(input) {
  const lower = input.toLowerCase();
  if (lower.includes('привет') || lower.includes('hello') || lower.includes('hi'))
    return 'Привет! Чем могу помочь?';
  if (lower.includes('как дела') || lower.includes('как ты'))
    return 'Всё отлично, готов помочь! Что хотите сделать?';
  if (lower.includes('что ты умеешь') || lower.includes('что умеешь'))
    return 'Я могу помочь с написанием кода, отвечать на вопросы, анализировать задачи и многое другое. Просто напишите, что вам нужно!';
  if (lower.includes('создай') || lower.includes('сделай') || lower.includes('напиши'))
    return 'Понял задачу. Начинаю работу...';
  if (lower.includes('спасибо') || lower.includes('благодарю'))
    return 'Пожалуйста! Если понадобится помощь — обращайтесь.';
  return 'Понял. Работаю над вашим запросом...';
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});
