(() => {
  const messagesEl = document.getElementById('messages');
  const inputEl = document.getElementById('userInput');
  const sendBtn = document.getElementById('sendBtn');
  const modelSelector = document.getElementById('modelSelector');
  const modelDropdown = document.getElementById('modelDropdown');
  const micBtn = document.getElementById('micBtn');
  const planCheck = document.getElementById('planMode');
  const tabs = document.querySelectorAll('.tab[data-tab]');
  const toolsView = document.getElementById('toolsView');
  const previewView = document.getElementById('previewView');
  const previewFrame = document.getElementById('previewFrame');

  let currentModel = 'economy';
  let sending = false;

  // ── Load history ──────────────────────────────────────
  async function loadMessages() {
    try {
      const res = await fetch('/api/messages');
      const msgs = await res.json();
      if (msgs.length === 0) {
        showEmptyState();
      } else {
        msgs.forEach(m => {
          if (m.role === 'user') appendUserMsg(m.content, m.ts);
          else appendAgentMsg(m.content, m.worked);
        });
        scrollBottom();
      }
    } catch (e) {
      console.error(e);
    }
  }

  function showEmptyState() {
    messagesEl.innerHTML = `
      <div class="empty-chat">
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
          <rect x="2" y="2" width="32" height="32" rx="7" stroke="#3b4258" stroke-width="2"/>
          <path d="M10 14h16M10 20h10" stroke="#3b4258" stroke-width="2" stroke-linecap="round"/>
        </svg>
        <p>Начните диалог</p>
        <span>Напишите задачу или вопрос ниже</span>
      </div>`;
  }

  // ── Append messages ───────────────────────────────────
  function appendUserMsg(content, ts) {
    const timeStr = formatTime(ts);
    const div = document.createElement('div');
    div.className = 'msg-user';
    div.innerHTML = `
      <div class="msg-user-meta">
        <span class="msg-user-name">Вы</span>
        <span class="msg-user-time">${timeStr}</span>
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

  function resolveThinking(thinkingId, content, worked) {
    const div = document.getElementById(`thinking-${thinkingId}`);
    if (!div) return;
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
      </div>
      <div class="msg-agent-bubble">${escHtml(content)}</div>
      <div class="worked-label">
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <circle cx="5" cy="5" r="4" stroke="currentColor" stroke-width="1"/>
          <path d="M5 3v2l1.5 1" stroke="currentColor" stroke-width="1" stroke-linecap="round"/>
        </svg>
        Работал ${worked} сек
      </div>`;
    scrollBottom();
  }

  function appendAgentMsg(content, worked) {
    const div = document.createElement('div');
    div.className = 'msg-agent';
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
      </div>
      <div class="msg-agent-bubble">${escHtml(content)}</div>
      ${worked ? `<div class="worked-label">
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <circle cx="5" cy="5" r="4" stroke="currentColor" stroke-width="1"/>
          <path d="M5 3v2l1.5 1" stroke="currentColor" stroke-width="1" stroke-linecap="round"/>
        </svg>
        Работал ${worked} сек
      </div>` : ''}`;
    messagesEl.appendChild(div);
  }

  // ── Send message ──────────────────────────────────────
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
        body: JSON.stringify({ content })
      });
      const data = await res.json();

      thinkEl.id = `thinking-${data.thinkingId}`;

      // Poll for reply
      pollReply(data.thinkingId, data.replyId);
    } catch (e) {
      thinkEl.remove();
      console.error(e);
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
          resolveThinking(thinkingId, msg.content, msg.worked);
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
    requestAnimationFrame(() => {
      messagesEl.scrollTop = messagesEl.scrollHeight;
    });
  }

  function removeEmptyState() {
    const empty = messagesEl.querySelector('.empty-chat');
    if (empty) empty.remove();
  }

  function autoResize() {
    inputEl.style.height = 'auto';
    inputEl.style.height = Math.min(inputEl.scrollHeight, 180) + 'px';
  }

  // ── Events ────────────────────────────────────────────
  sendBtn.addEventListener('click', sendMessage);

  inputEl.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  inputEl.addEventListener('input', autoResize);

  // Tabs
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const t = tab.dataset.tab;
      if (t === 'new') return;
      tabs.forEach(x => x.classList.remove('active'));
      tab.classList.add('active');
      if (t === 'preview') {
        toolsView.classList.remove('active');
        previewView.classList.add('active');
      } else {
        previewView.classList.remove('active');
        toolsView.classList.add('active');
      }
    });
  });

  // Model dropdown
  modelSelector.addEventListener('click', e => {
    e.stopPropagation();
    const rect = modelSelector.getBoundingClientRect();
    modelDropdown.style.bottom = (window.innerHeight - rect.top + 4) + 'px';
    modelDropdown.style.left = rect.left + 'px';
    modelDropdown.classList.toggle('open');
  });

  document.querySelectorAll('.dropdown-item').forEach(item => {
    item.addEventListener('click', () => {
      currentModel = item.dataset.model;
      document.querySelectorAll('.dropdown-item').forEach(x => x.classList.remove('active'));
      item.classList.add('active');
      const labels = { economy: 'Эконом', standard: 'Стандарт', pro: 'Про' };
      modelSelector.querySelector('span').textContent = labels[currentModel];
      modelDropdown.classList.remove('open');
    });
  });

  document.addEventListener('click', () => modelDropdown.classList.remove('open'));

  // Mic (visual only)
  let recording = false;
  micBtn.addEventListener('click', () => {
    recording = !recording;
    micBtn.classList.toggle('recording', recording);
    micBtn.title = recording ? 'Остановить' : 'Голосовой ввод';
  });

  // Plan mode label update
  planCheck.addEventListener('change', () => {
    const label = document.querySelector('.toggle-label');
    label.textContent = planCheck.checked ? 'Планировщик ✓' : 'Планировщик';
  });

  // Run btn — refresh preview
  document.getElementById('runBtn').addEventListener('click', () => {
    previewFrame.src = previewFrame.src;
    // Switch to preview tab
    tabs.forEach(x => x.classList.remove('active'));
    document.querySelector('[data-tab="preview"]').classList.add('active');
    toolsView.classList.remove('active');
    previewView.classList.add('active');
  });

  // Project name editable
  const nameEl = document.getElementById('projectName');
  nameEl.addEventListener('dblclick', () => {
    const input = document.createElement('input');
    input.value = nameEl.textContent;
    input.style.cssText = `background:transparent;border:none;border-bottom:1px solid var(--accent);
      color:var(--text);font-size:13px;font-weight:500;width:120px;outline:none;`;
    nameEl.replaceWith(input);
    input.focus();
    input.select();
    const done = () => {
      const span = document.createElement('span');
      span.id = 'projectName';
      span.className = 'project-name';
      span.textContent = input.value || 'МойПроект';
      span.title = 'Двойной клик для редактирования';
      input.replaceWith(span);
      span.addEventListener('dblclick', nameEl.ondblclick);
      document.title = span.textContent + ' — Агент';
    };
    input.addEventListener('blur', done);
    input.addEventListener('keydown', e => { if (e.key === 'Enter') input.blur(); });
  });

  // Keyboard shortcut: Ctrl+L to clear chat
  document.addEventListener('keydown', e => {
    if (e.ctrlKey && e.key === 'l') {
      e.preventDefault();
      fetch('/api/messages', { method: 'DELETE' }).then(() => {
        messagesEl.innerHTML = '';
        showEmptyState();
      });
    }
  });

  // Init
  loadMessages();
})();
