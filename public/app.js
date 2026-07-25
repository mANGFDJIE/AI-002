(() => {
  const messagesEl = document.getElementById('messages');
  const inputEl = document.getElementById('userInput');
  const sendBtn = document.getElementById('sendBtn');
  const modelSelector = document.getElementById('modelSelector');
  const modelLabel = document.getElementById('modelLabel');
  const modelDot = document.getElementById('modelDot');
  const modelDropdown = document.getElementById('modelDropdown');
  const micBtn = document.getElementById('micBtn');
  const planCheck = document.getElementById('planMode');
  const tabs = document.querySelectorAll('.tab[data-tab]');
  const toolsView = document.getElementById('toolsView');
  const previewView = document.getElementById('previewView');
  const previewFrame = document.getElementById('previewFrame');
  const settingsBtn = document.getElementById('settingsBtn');
  const settingsPanel = document.getElementById('settingsPanel');
  const closeSettings = document.getElementById('closeSettings');
  const providerGrid = document.getElementById('providerGrid');
  const scanBtn = document.getElementById('scanModels');
  const scanStatus = document.getElementById('scanStatus');

  let currentModel = 'auto';
  let sending = false;
  let modelPresets = {};
  let config = { hasKey: false };

  const colorMap = { economy: '#4ade80', standard: '#3b82f6', pro: '#a78bfa', auto: 'linear-gradient(135deg,#4ade80,#3b82f6,#a78bfa)' };

  async function loadConfig() {
    try {
      const res = await fetch('/api/config');
      config = await res.json();
      modelPresets = config.presets || {};
      renderModelDropdown();
      renderProviders();
      updateModelDisplay();
    } catch (e) { console.error(e); }
  }

  async function loadMessages() {
    try {
      const res = await fetch('/api/messages');
      const msgs = await res.json();
      if (msgs.length === 0) showEmptyState();
      else msgs.forEach(m => m.role === 'user' ? appendUserMsg(m.content, m.ts) : appendAgentMsg(m.content, m.worked, m.model, m.error));
      scrollBottom();
    } catch (e) { console.error(e); }
  }

  function showEmptyState() {
    messagesEl.innerHTML = `
      <div class="empty-chat">
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
          <rect x="2" y="2" width="32" height="32" rx="7" stroke="#3b4258" stroke-width="2"/>
          <path d="M10 14h16M10 20h10" stroke="#3b4258" stroke-width="2" stroke-linecap="round"/>
        </svg>
        <p>Начните диалог</p>
        <span>Напишите задачу или вопрос. Модель подберётся автоматически.</span>
      </div>`;
  }

  function renderModelDropdown() {
    modelDropdown.innerHTML = '';
    Object.entries(modelPresets).forEach(([key, p]) => {
      const div = document.createElement('div');
      div.className = 'dropdown-item' + (key === currentModel ? ' active' : '');
      div.dataset.model = key;
      div.innerHTML = `<span class="dot ${p.color}"></span>${p.label}<span class="desc">${p.desc}</span>`;
      div.addEventListener('click', () => selectModel(key));
      modelDropdown.appendChild(div);
    });
  }

  function selectModel(key) {
    currentModel = key;
    updateModelDisplay();
    document.querySelectorAll('.dropdown-item').forEach(x => x.classList.toggle('active', x.dataset.model === key));
    modelDropdown.classList.remove('open');
  }

  function updateModelDisplay() {
    const p = modelPresets[currentModel] || { label: 'Авто', color: 'auto' };
    modelLabel.textContent = p.label;
    modelDot.style.background = colorMap[p.color] || colorMap.auto;
  }

  function renderProviders() {
    const providers = [
      { name: 'OpenAI', key: 'OPENAI_API_KEY', ok: config.hasKey, models: 'GPT-4o, o1, o3-mini, GPT-4o mini' },
      { name: 'Anthropic', key: 'ANTHROPIC_API_KEY', ok: false, models: 'Claude 3.5 Sonnet, Claude 3 Opus' },
      { name: 'Google', key: 'GOOGLE_API_KEY', ok: false, models: 'Gemini 1.5 Pro, Flash' },
      { name: 'OpenRouter', key: 'OPENROUTER_API_KEY', ok: false, models: 'DeepSeek, Llama, Qwen, Mistral' },
      { name: 'Groq', key: 'GROQ_API_KEY', ok: false, models: 'Llama 3, Mixtral, Gemma' },
      { name: 'Ollama', key: 'OLLAMA_HOST', ok: false, models: 'Локальные модели' }
    ];
    providerGrid.innerHTML = providers.map(pr => `
      <div class="provider-card">
        <div class="info">
          <div class="name">${pr.name}</div>
          <div class="models">${pr.models}</div>
        </div>
        <div class="status ${pr.ok ? 'ok' : 'missing'}">${pr.ok ? 'Подключено' : 'Нужен ключ'}</div>
      </div>
    `).join('');
  }

  // ── Messages ──────────────────────────────────────────
  function appendUserMsg(content, ts) {
    const div = document.createElement('div');
    div.className = 'msg-user';
    div.innerHTML = `
      <div class="msg-user-meta">
        <span class="msg-user-name">Вы</span>
        <span class="msg-user-time">${formatTime(ts)}</span>
      </div>
      <div class="msg-user-bubble">${escHtml(content)}</div>`;
    removeEmptyState();
    messagesEl.appendChild(div);
  }

  function appendThinking(thinkingId) {
    const div = document.createElement('div');
    div.className = 'msg-agent';
    div.id = `thinking-${thinkingId}`;
    div.innerHTML = `
      <div class="msg-agent-status">
        <div class="status-icon"><div class="spinner"></div></div>
        <span>Думаю...</span>
      </div>`;
    messagesEl.appendChild(div);
    scrollBottom();
    return div;
  }

  function resolveThinking(thinkingId, content, worked, model, error) {
    const div = document.getElementById(`thinking-${thinkingId}`);
    if (!div) return;
    div.className = 'msg-agent' + (error ? ' error-bubble' : '');
    div.innerHTML = `
      <div class="msg-agent-status">
        <div class="status-icon">
          <div class="check-icon">
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
              <path d="M1.5 4l2 2 3-3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
        </div>
        <span>Подтверждение присутствия</span>
        ${model ? `<span class="model-tag">${model}</span>` : ''}
      </div>
      <div class="msg-agent-bubble">${renderMarkdown(content)}</div>
      <div class="worked-label">
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <circle cx="5" cy="5" r="4" stroke="currentColor" stroke-width="1"/>
          <path d="M5 3v2l1.5 1" stroke="currentColor" stroke-width="1" stroke-linecap="round"/>
        </svg>
        Работал ${worked} сек
      </div>`;
    scrollBottom();
  }

  function appendAgentMsg(content, worked, model, error) {
    const div = document.createElement('div');
    div.className = 'msg-agent' + (error ? ' error-bubble' : '');
    div.innerHTML = `
      <div class="msg-agent-status">
        <div class="status-icon">
          <div class="check-icon">
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
              <path d="M1.5 4l2 2 3-3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
        </div>
        <span>Подтверждение присутствия</span>
        ${model ? `<span class="model-tag">${model}</span>` : ''}
      </div>
      <div class="msg-agent-bubble">${renderMarkdown(content)}</div>
      ${worked ? `<div class="worked-label">
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <circle cx="5" cy="5" r="4" stroke="currentColor" stroke-width="1"/>
          <path d="M5 3v2l1.5 1" stroke="currentColor" stroke-width="1" stroke-linecap="round"/>
        </svg>
        Работал ${worked} сек
      </div>` : ''}`;
    messagesEl.appendChild(div);
  }

  // ── Markdown renderer (basic) ─────────────────────────
  function renderMarkdown(text) {
    if (!text) return '';
    let html = escHtml(text);

    // Code blocks ```lang
    html = html.replace(/```([a-z]*)\n?([\s\S]*?)```/g, (m, lang, code) => {
      return `<pre><code class="language-${lang}">${code.trim()}</code></pre>`;
    });
    // Inline `code`
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    // Bold
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    // Italic
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    // Lists
    html = html.replace(/^\s*[-*]\s+(.*)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
    // Paragraphs
    html = html.split(/\n\n+/).map(p => p.trim() ? `<p>${p}</p>` : '').join('');
    // Line breaks within paragraphs
    html = html.replace(/<p>([^]*?)<\/p>/g, (m, c) => `<p>${c.replace(/\n/g, '<br>')}</p>`);

    return html;
  }

  // ── Send ──────────────────────────────────────────────
  async function sendMessage() {
    const content = inputEl.value.trim();
    if (!content || sending) return;

    sending = true;
    sendBtn.disabled = true;
    inputEl.value = '';
    autoResize();

    appendUserMsg(content, Date.now());
    scrollBottom();

    const thinkEl = appendThinking('temp');
    thinkEl.id = 'thinking-temp';

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, model: currentModel })
      });
      const data = await res.json();
      if (res.status !== 200) throw new Error(data.error || 'Ошибка');
      thinkEl.id = `thinking-${data.thinkingId}`;
      pollReply(data.thinkingId, data.replyId);
    } catch (e) {
      thinkEl.remove();
      appendAgentMsg('Ошибка: ' + e.message, 0, 'Система', true);
      sending = false;
      sendBtn.disabled = false;
    }
  }

  async function pollReply(thinkingId, replyId) {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/messages/${replyId}`);
        if (res.status === 200) {
          const msg = await res.json();
          clearInterval(interval);
          resolveThinking(thinkingId, msg.content, msg.worked, msg.model, msg.error);
          sending = false;
          sendBtn.disabled = false;
        }
      } catch (e) {
        clearInterval(interval);
        sending = false;
        sendBtn.disabled = false;
      }
    }, 300);
  }

  // ── Helpers ───────────────────────────────────────────
  function escHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatTime(ts) {
    const d = new Date(ts);
    const now = new Date();
    const diff = Math.floor((now - d) / 1000);
    if (diff < 60) return `${diff} сек назад`;
    if (diff < 3600) return `${Math.floor(diff / 60)} мин назад`;
    return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  }

  function scrollBottom() {
    requestAnimationFrame(() => { messagesEl.scrollTop = messagesEl.scrollHeight; });
  }
  function removeEmptyState() { messagesEl.querySelector('.empty-chat')?.remove(); }
  function autoResize() { inputEl.style.height = 'auto'; inputEl.style.height = Math.min(inputEl.scrollHeight, 180) + 'px'; }

  // ── Events ────────────────────────────────────────────
  sendBtn.addEventListener('click', sendMessage);
  inputEl.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } });
  inputEl.addEventListener('input', autoResize);

  tabs.forEach(tab => tab.addEventListener('click', () => {
    const t = tab.dataset.tab; if (t === 'new') return;
    tabs.forEach(x => x.classList.remove('active'));
    tab.classList.add('active');
    if (t === 'preview') { toolsView.classList.remove('active'); previewView.classList.add('active'); }
    else { previewView.classList.remove('active'); toolsView.classList.add('active'); }
  }));

  modelSelector.addEventListener('click', e => {
    e.stopPropagation();
    const rect = modelSelector.getBoundingClientRect();
    modelDropdown.style.bottom = (window.innerHeight - rect.top + 4) + 'px';
    modelDropdown.style.left = rect.left + 'px';
    modelDropdown.classList.toggle('open');
  });
  document.addEventListener('click', () => modelDropdown.classList.remove('open'));

  let recording = false;
  micBtn.addEventListener('click', () => {
    recording = !recording;
    micBtn.classList.toggle('recording', recording);
    micBtn.title = recording ? 'Остановить' : 'Голосовой ввод';
  });

  planCheck.addEventListener('change', () => {
    document.querySelector('.toggle-label').textContent = planCheck.checked ? 'Планировщик ✓' : 'Планировщик';
  });

  document.getElementById('runBtn').addEventListener('click', () => {
    previewFrame.src = previewFrame.src;
    tabs.forEach(x => x.classList.remove('active'));
    document.querySelector('[data-tab="preview"]').classList.add('active');
    toolsView.classList.remove('active');
    previewView.classList.add('active');
  });

  const nameEl = document.getElementById('projectName');
  nameEl.addEventListener('dblclick', () => {
    const input = document.createElement('input');
    input.value = nameEl.textContent;
    input.style.cssText = `background:transparent;border:none;border-bottom:1px solid var(--accent);color:var(--text);font-size:13px;font-weight:500;width:120px;outline:none;`;
    nameEl.replaceWith(input);
    input.focus(); input.select();
    const done = () => {
      const span = document.createElement('span');
      span.id = 'projectName'; span.className = 'project-name'; span.textContent = input.value || 'МойПроект';
      span.title = 'Двойной клик для редактирования';
      input.replaceWith(span);
      span.addEventListener('dblclick', nameEl.ondblclick);
      document.title = span.textContent + ' — Агент';
    };
    input.addEventListener('blur', done);
    input.addEventListener('keydown', e => { if (e.key === 'Enter') input.blur(); });
  });

  document.addEventListener('keydown', e => {
    if (e.ctrlKey && e.key === 'l') {
      e.preventDefault();
      fetch('/api/messages', { method: 'DELETE' }).then(() => { messagesEl.innerHTML = ''; showEmptyState(); });
    }
  });

  // Settings panel
  settingsBtn.addEventListener('click', () => settingsPanel.classList.add('open'));
  closeSettings.addEventListener('click', () => settingsPanel.classList.remove('open'));
  document.addEventListener('click', e => { if (!settingsPanel.contains(e.target) && !settingsBtn.contains(e.target)) settingsPanel.classList.remove('open'); });

  scanBtn.addEventListener('click', async () => {
    scanBtn.disabled = true;
    scanBtn.innerHTML = `<div class="spinner" style="width:12px;height:12px;border-width:1.5px;"></div> Сканирование...`;
    scanStatus.textContent = 'Проверяю доступные модели через OpenAI...';
    try {
      const res = await fetch('/api/config');
      const cfg = await res.json();
      if (cfg.hasKey) {
        scanStatus.innerHTML = 'OpenAI подключен. Доступные модели:<br>• GPT-4o<br>• GPT-4o mini<br>• o1<br>• o1-mini<br>• o3-mini';
      } else {
        scanStatus.textContent = 'Ключ OpenAI не найден. Добавьте OPENAI_API_KEY в секреты.';
      }
    } catch (e) {
      scanStatus.textContent = 'Ошибка сканирования: ' + e.message;
    } finally {
      scanBtn.disabled = false;
      scanBtn.textContent = 'Сканировать модели';
    }
  });

  loadConfig();
  loadMessages();
})();
