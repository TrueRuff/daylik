// Экран «Журнал»: последние события приложения с фильтром по уровню

import { getLogs, clearLogs } from '../core/storage.js';
import { t } from '../core/i18n.js';
import { escapeHtml } from './dom.js';

const LEVEL_KEYS = ['debug', 'info', 'warn', 'error'];
let filter = 'debug'; // минимальный уровень показа

function formatTime(ts) {
  const d = new Date(ts);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export function initLogScreen(root) {
  async function render() {
    const rows = await getLogs({ limit: 200, minLevel: filter });
    root.innerHTML = `
      <div class="row between">
        <h2>${t('log.title')}</h2>
        <div class="row">
          <select id="log-filter">
            ${LEVEL_KEYS.map((k) =>
              `<option value="${k}"${k === filter ? ' selected' : ''}>${t(`level.${k}`)}</option>`).join('')}
          </select>
          <button id="log-clear" class="secondary">${t('log.clear')}</button>
        </div>
      </div>
      ${rows.length
        ? `<table class="log-table">
            <thead><tr><th>${t('log.time')}</th><th>${t('log.level')}</th><th>${t('log.event')}</th></tr></thead>
            <tbody>
              ${rows.map((r) => `
                <tr class="log-${r.level}">
                  <td>${formatTime(r.time)}</td>
                  <td>${t(`level.${r.level}`)}</td>
                  <td>${escapeHtml(r.event)}${r.data ? ` <span class="muted">${escapeHtml(JSON.stringify(r.data))}</span>` : ''}</td>
                </tr>`).join('')}
            </tbody>
          </table>`
        : `<p class="muted">${t('log.empty')}</p>`}`;
  }

  root.addEventListener('change', (e) => {
    if (e.target.id === 'log-filter') {
      filter = e.target.value;
      render();
    }
  });

  root.addEventListener('click', (e) => {
    if (e.target.id === 'log-clear') {
      clearLogs().then(render);
    }
  });

  document.addEventListener('tab-shown', (e) => {
    if (e.detail === 'log') render();
  });

  render();
}
