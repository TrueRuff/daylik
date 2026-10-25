// Экран «Ввод»: свободный текст → разбор → подтверждение типа и группы → сохранение

import { categorize } from '../core/categorize.js';
import { Task, Sphere, Practice } from '../core/models.js';
import { saveTask, saveSphere, savePractice, getAllSpheres } from '../core/storage.js';
import { dayNames, timeToMinutes, localInputToTs } from '../core/schedule.js';
import { t } from '../core/i18n.js';
import { escapeHtml, daysCheckboxes, timeRangeFields } from './dom.js';

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
    state = { parsed, kind: parsed.kind, rawText: text, group: parsed.group || 'П', spheres };
    renderConfirm();
  }

  function renderConfirm() {
    const { parsed } = state;
    const confirmEl = root.querySelector('#confirm');
    confirmEl.innerHTML = `
      <div class="card">
        <div class="row between">
          <strong>${kindTitle(state.kind)}</strong>
          <span class="muted">${providerTitle(parsed)}</span>
        </div>
        <div class="row">
          ${t('common.type')}:
          ${['task', 'routine', 'sphere'].map((k) =>
            `<button class="grp${k === state.kind ? ' on' : ''}" data-kind="${k}">${t(`type.${k}`)}</button>`).join('')}
        </div>
        <p class="muted">${t(`type.hint.${state.kind}`)}</p>
        <label>${t('common.title')} <input id="c-title" value="${escapeHtml(parsed.title)}"></label>
        <div class="row">
          ${t('common.group')}:
          ${['Н', 'Ж', 'П'].map((g) =>
            `<button class="grp${g === state.group ? ' on' : ''}" data-g="${g}">${g} — ${t(`group.${g}`)}</button>`).join('')}
        </div>
        ${state.kind === 'routine' ? `
        ${timeRangeFields()}
        <div class="days">${daysCheckboxes()}</div>` : ''}
        ${state.kind === 'task' ? `
        <div class="row">
          <label>${t('task.duration')} <input id="c-dur" type="number" min="5" step="5" value="${parsed.durationMin || 30}"></label>
          <label>${t('task.remindOptional')} <input id="c-remind" type="datetime-local"></label>
        </div>
        <div class="row">
          <label>${t('repeat.label')}
            <select id="c-repeat">
              <option value="">${t('repeat.none')}</option>
              <option value="daily">${t('repeat.daily')}</option>
              <option value="weekly">${t('repeat.weekly')}</option>
              <option value="every">${t('repeat.every')}</option>
            </select>
          </label>
          <label id="c-repeat-n-wrap" hidden>${t('repeat.everyDays')} <input id="c-repeat-n" type="number" min="2" max="30" value="3"></label>
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
    const kindBtn = e.target.closest('[data-kind]');
    if (kindBtn) {
      state.kind = kindBtn.dataset.kind;
      renderConfirm();
      return;
    }
    const grp = e.target.closest('[data-g]');
    if (grp) {
      state.group = grp.dataset.g;
      renderConfirm();
      return;
    }
    if (e.target.id !== 'c-save' || !state) return;

    const { rawText } = state;
    const title = confirmEl.querySelector('#c-title').value.trim();
    if (!title) return;
    const id = crypto.randomUUID();

    if (state.kind === 'sphere') {
      await saveSphere(new Sphere({ id, name: title, group: state.group }));
      saved(t('spheres.saved', { title }));
    } else if (state.kind === 'routine') {
      const days = [...confirmEl.querySelectorAll('.days input:checked')].map((c) => Number(c.dataset.day));
      await savePractice(new Practice({
        id,
        title,
        days,
        start: timeToMinutes(confirmEl.querySelector('.js-start').value || '09:00'),
        end: timeToMinutes(confirmEl.querySelector('.js-end').value || '10:00'),
      }));
      saved(t('routine.saved', { title }));
    } else {
      const dur = Number(confirmEl.querySelector('#c-dur').value) || 30;
      const remind = confirmEl.querySelector('#c-remind').value;
      const sphereId = confirmEl.querySelector('#c-sphere').value || null;
      const repeatKind = confirmEl.querySelector('#c-repeat').value;
      const repeatN = Number(confirmEl.querySelector('#c-repeat-n')?.value) || 3;
      await saveTask(new Task({
        id,
        rawText,
        title,
        group: state.group,
        durationMin: dur,
        sphereId,
        dueAt: localInputToTs(remind),
        status: 'todo',
        source: state.parsed.provider,
        repeatRule: repeatKind === 'every' ? `every:${repeatN}` : (repeatKind || null),
      }));
      saved(t('task.saved', { title, group: state.group }) + (remind ? ` ${t('task.willRemind')}` : ''));
    }
  });

  root.addEventListener('change', (e) => {
    if (e.target.id === 'c-repeat') {
      const wrap = root.querySelector('#c-repeat-n-wrap');
      if (wrap) wrap.hidden = e.target.value !== 'every';
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
