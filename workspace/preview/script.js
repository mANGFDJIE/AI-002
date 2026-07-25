document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('login-form');
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const togglePasswordBtn = document.getElementById('toggle-password');
  const globalError = document.getElementById('global-error');

  const DEMO_CREDENTIALS = {
    username: 'admin',
    password: 'password'
  };

  // Эмуляция перезагрузки страницы: очистка ранее введённых данных
  sessionStorage.removeItem('isLoggedIn');

  // Вспомогательная функция для показа ошибки под полем
  function showFieldError(inputId, message) {
    const errorEl = document.getElementById(inputId + '-error');
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.classList.add('visible');
    }
  }

  // Скрытие ошибки поля
  function clearFieldError(inputId) {
    const errorEl = document.getElementById(inputId + '-error');
    if (errorEl) {
      errorEl.textContent = '';
      errorEl.classList.remove('visible');
    }
  }

  // Глобальная ошибка (под кнопкой)
  function showGlobalError(msg) {
    globalError.textContent = msg;
  }

  function clearGlobalError() {
    globalError.textContent = '';
  }

  // Переключение видимости пароля
  togglePasswordBtn.addEventListener('click', () => {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    togglePasswordBtn.textContent = type === 'password' ? '👁️' : '🙈';
  });

  // Валидация в реальном времени при вводе
  usernameInput.addEventListener('input', () => {
    clearFieldError('username');
    clearGlobalError();
  });

  passwordInput.addEventListener('input', () => {
    clearFieldError('password');
    clearGlobalError();
  });

  // Обработка отправки формы
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    clearGlobalError();

    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    // Базовая валидация полей
    let valid = true;

    if (!username) {
      showFieldError('username', 'Введите логин');
      valid = false;
    }

    if (!password) {
      showFieldError('password', 'Введите пароль');
      valid = false;
    }

    if (!valid) return;

    // Простая эмуляция аутентификации (проверка демо-учётных данных)
    if (username === DEMO_CREDENTIALS.username && password === DEMO_CREDENTIALS.password) {
      // Сохраняем состояние входа (для демо — в sessionStorage)
      sessionStorage.setItem('isLoggedIn', 'true');
      sessionStorage.setItem('username', username);
      // Перенаправление на "главную страницу" — просто перезагрузка этой же страницы
      // В реальном приложении вы бы использовали window.location.href = 'dashboard.html';
      alert(`Добро пожаловать, ${username}!`);
      form.reset();
    } else {
      showGlobalError('Неверный логин или пароль');
    }
  });
});
