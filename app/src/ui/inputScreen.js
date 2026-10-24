// Экран «Ввод»: свободный текст → разбор → подтверждение типа и группы → сохранение

import { categorize } from '../core/categorize.js';
import { Task, Sphere, Practice } from '../core/models.js';
import { saveTask, saveSphere, savePractice, getAllSpheres } from '../core/storage.js';
import { dayNames, timeToMinutes, localInputToTs } from '../core/schedule.js';
import { t } from '../core/i18n.js';
import { escapeHtml } from './dom.js';

function kindTitle(kind) {
  return t(`kind.${kind}`);
}

function providerTitle(parsed) {
  if (parsed.provider === 'llm') return t('provider.llm');
  return parsed.llmFailed ? t('provider.llmFailed') : t('provider.rules');
}

export function initInputScreen(root) {
  let state = null;

  function renderStatic() {
    root.innerHTML = `
      <h2>${t('input.title')}</h2>
      <p class="muted">${t('input.intro')}</p>
      <div class="input-row">
        <input id="raw" placeholder="${t('input.placeholder')}">
        <button id="parse">${t('input.parse')}</button>
      </div>
      <div id="confirm"></div>`;
  }

  renderStatic();

  root.addEventListener('click', (e) => {
    if (e.target.id === 'parse') parse();
  });
  root.addEventListener('keydown', (e) => {
    if (e.target.id === 'raw' && e.key === 'Enter') parse();
  });

  document.addEventListener('tab-shown', (e) => {
    if (e.detail === 'input' && !state) renderStatic();
  });

  async function parse() {
    const rawEl = root.querySelector('#raw');
    const text = rawEl.value.trim();
    if (!text) return;
    const [parsed, spheres] = await Promise.all([categorize(text), getAllSpheres()]);
    state = { parsed, rawText: text, group: parsed.group || 'П', spheres };
    renderConfirm();
  }

  function renderConfirm() {
    const { parsed } = state;
    const confirmEl = root.querySelector('#confirm');
    confirmEl.innerHTML = `
      <div class="card">
        <div class="row between">
          <strong>${kindTitle(parsed.kind)}</strong>
          <span class="muted">${providerTitle(parsed)}</span>
        </div>
        <label>${t('common.title')} <input id="c-title" value="${escapeHtml(parsed.title)}"></label>
        <div class="row">
          ${t('common.group')}:
          ${['Н', 'Ж', 'П'].map((g) =>
            `<button class="grp${g === state.group ? ' on' : ''}" data-g="${g}">${g} — ${t(`group.${g}`)}</button>`).join('')}
        </div>
        ${parsed.kind === 'routine' ? `
        <div class="row">
          <label>${t('common.start')} <input id="c-start" type="time" value="09:00"></label>
          <label>${t('common.end')} <input id="c-end" type="time" value="10:00"></label>
        </div>
        <div class="days">
          ${dayNames().map((d, i) => `<label class="day"><input type="checkbox" data-day="${i + 1}" checked>${d}</label>`).join('')}
        </div>` : ''}
        ${parsed.kind === 'task' ? `
        <div class="row">
          <label>${t('task.duration')} <input id="c-dur" type="number" min="5" step="5" value="${parsed.durationMin || 30}"></label>
          <label>${t('task.remindOptional')} <input id="c-remind" type="datetime-local"></label>
        </div>
        <label>${t('common.sphere')}
          <select id="c-sphere">
            <option value="">${t('task.noSphere')}</option>
            ${state.spheres.map((s) => `<option value="${s.id}">${escapeHtml(s.name)}</option>`).join('')}
          </select>
        </label>` : ''}
        <div class="row"><button id="c-save">${t('common.save')}</button></div>
      </div>`;
  }

  root.addEventListener('click', async (e) => {
    const confirmEl = root.querySelector('#confirm');
    const grp = e.target.closest('.grp');
    if (grp) {
      state.group = grp.dataset.g;
      renderConfirm();
      return;
    }
    if (e.target.id !== 'c-save' || !state) return;

    const { parsed, rawText } = state;
    const title = confirmEl.querySelector('#c-title').value.trim();
    if (!title) return;
    const id = crypto.randomUUID();

    if (parsed.kind === 'sphere') {
      await saveSphere(new Sphere({ id, name: title, group: state.group }));
      saved(t('spheres.saved', { title }));
    } else if (parsed.kind === 'routine') {
      const days = [...confirmEl.querySelectorAll('.days input:checked')].map((c) => Number(c.dataset.day));
      await savePractice(new Practice({
        id,
        title,
        days,
        start: timeToMinutes(confirmEl.querySelector('#c-start').value || '09:00'),
        end: timeToMinutes(confirmEl.querySelector('#c-end').value || '10:00'),
      }));
      saved(t('routine.saved', { title }));
    } else {
      const dur = Number(confirmEl.querySelector('#c-dur').value) || 30;
      const remind = confirmEl.querySelector('#c-remind').value;
      const sphereId = confirmEl.querySelector('#c-sphere').value || null;
      await saveTask(new Task({
        id,
        rawText,
        title,
        group: state.group,
        durationMin: dur,
        sphereId,
        dueAt: localInputToTs(remind),
        status: 'todo',
        source: parsed.provider,
      }));
      saved(t('task.saved', { title, group: state.group }) + (remind ? ` ${t('task.willRemind')}` : ''));
    }
  });

  function saved(text) {
    const confirmEl = root.querySelector('#confirm');
    const rawEl = root.querySelector('#raw');
    confirmEl.innerHTML = `<div class="card"><p>${escapeHtml(text)}</p></div>`;
    rawEl.value = '';
    state = null;
  }
}
