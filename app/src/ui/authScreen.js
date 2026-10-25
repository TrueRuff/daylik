// Экран входа: вход в существующий аккаунт или создание нового.
// После успеха вызывает onSuccess(account) — main.js показывает приложение.

import { login, register, ensureBuiltinAdmin } from '../core/auth.js';
import { t, onChange } from '../core/i18n.js';

export function initAuthScreen(root, onSuccess) {
  let mode = 'login'; // login | register
  let lastError = '';

  function render() {
    root.innerHTML = `
      <div class="auth-card">
        <h2>${t('app.name')}</h2>
        <p class="muted">${mode === 'login' ? t('auth.enter') : t('auth.register')}</p>
        <label>${t('auth.loginLabel')} <input id="a-login" autocomplete="username"></label>
        <label>${t('auth.passwordLabel')} <input id="a-pass" type="password" autocomplete="current-password"></label>
        ${lastError ? `<p class="auth-error">${t(lastError)}</p>` : ''}
        <button id="a-submit">${mode === 'login' ? t('auth.loginBtn') : t('auth.registerBtn')}</button>
        <button id="a-switch" class="secondary">${mode === 'login' ? t('auth.toRegister') : t('auth.toLogin')}</button>
      </div>`;
    root.querySelector('#a-login').focus();
  }

  async function submit() {
    const name = root.querySelector('#a-login').value;
    const pass = root.querySelector('#a-pass').value;
    const res = mode === 'login' ? await login(name, pass) : await register(name, pass);
    if (res.error) {
      lastError = res.error;
      render();
      return;
    }
    lastError = '';
    onSuccess(res.account);
  }

  root.addEventListener('click', async (e) => {
    if (e.target.id === 'a-switch') {
      mode = mode === 'login' ? 'register' : 'login';
      lastError = '';
      render();
      return;
    }
    if (e.target.id === 'a-submit') await submit();
  });

  root.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.closest('#a-login, #a-pass')) submit();
  });

  onChange(render); // смена языка перерисовывает форму

  return {
    show() {
      ensureBuiltinAdmin().then(render);
    },
  };
}
