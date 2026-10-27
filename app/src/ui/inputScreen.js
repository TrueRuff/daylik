// модалка «Добавить»: свободный текст → разбор → подтверждение типа и
// группы. Открывается кнопкой «+» в шапке из любого места приложения
// (отдельного экрана ввода больше нет).

import { categorize } from '../core/categorize.js';
import { Task, Sphere } from '../core/models.js';
import { saveTask, saveSphere, getAllSpheres } from '../core/storage.js';
import { t, onChange } from '../core/i18n.js';
import { escapeHtml, bindTimeMasks, remindFieldsHtml, handleRemindClick, readRemindInput } from './dom.js';

let root = null;      // контейнер модалки, живёт на странице
let state = null;     // текущий разбор (после «Разобрать»)
let savedMsg = null;  // подтверждение после сохранения

function kindTitle(kind) {
  return t(`kind.${kind}`);
}

function providerTitle(parsed) {
  if (parsed.provider === 'llm') return t('provider.llm');
  return parsed.llmFailed ? t('provider.llmFailed') : t('provider.rules');
}

// иконки типов: выбор по узнаванию, без чтения подписей
const TYPE_ICONS = {
  task: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 12.5l5 5L19.5 7"/></svg>',
  ongoing: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-2.6-6.4"/><path d="M21 3v6h-6"/></svg>',
  sphere: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.5"/><path d="M15.2 8.8l-1.8 4.6-4.6 1.8 1.8-4.6z"/></svg>',
};

// поля, зависящие от типа: при смене типа перерисовывается только этот блок,
// кнопки типов/группы и набранный текст остаются на месте (без мерцания).
// «Продолжительное» — дело с повтором (проект по 30 минут в день); рутины
// (сон, готовка) создаются не здесь, а на «Направлениях».
function extraHtml() {
  if (state.kind === 'ongoing') {
    const def = state.parsed.durationMin || 30;
    return `
      <div class="row">
        <label>${t('task.duration')} <input id="c-dur" type="number" min="5" step="5" value="${def}"></label>
      </div>
      <div class="chips">
        ${[10, 20, 30, 60].map((m) => `<button type="button" class="grp chip${m === def ? ' on' : ''}" data-dur="${m}">${m}</button>`).join('')}
      </div>
      <div class="row">
        <label>${t('repeat.label')}
          <select id="c-repeat">
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
      </label>`;
  }
  if (state.kind !== 'task') return '';
  const def = state.parsed.durationMin || 30;
  return `
    <div class="row">
      <label>${t('task.duration')} <input id="c-dur" type="number" min="5" step="5" value="${def}"></label>
    </div>
    <div class="chips">
      ${[10, 20, 30, 60].map((m) => `<button type="button" class="grp chip${m === def ? ' on' : ''}" data-dur="${m}">${m}</button>`).join('')}
    </div>
    <details class="more-params">
      <summary>${t('task.moreParams')}</summary>
      <p class="muted">${t('task.moreParamsHint')}</p>
      <label>${t('task.remind')}</label>
      ${remindFieldsHtml('c')}
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
      </label>
    </details>`;
}

function confirmCardHtml() {
  return `
    <div class="card">
      <div class="row between">
        <strong id="c-kind">${kindTitle(state.kind)}</strong>
        <span class="muted">${providerTitle(state.parsed)}</span>
      </div>
      <div class="row">
        ${t('common.type')}:
        ${['task', 'ongoing', 'sphere'].map((k) =>
          `<button type="button" class="grp${k === state.kind ? ' on' : ''}" data-kind="${k}">${TYPE_ICONS[k]}${t(`type.${k}`)}</button>`).join('')}
      </div>
      <p class="muted" id="c-hint">${t(`type.hint.${state.kind}`)}</p>
      <label>${t('common.title')} <input id="c-title" value="${escapeHtml(state.parsed.title)}"></label>
      <div class="row">
        ${t('common.group')}:
        ${['Н', 'Ж', 'П'].map((g) =>
          `<button type="button" class="grp${g === state.group ? ' on' : ''}" data-g="${g}">${g} — ${t(`group.${g}`)}</button>`).join('')}
      </div>
      <div id="c-extra">${extraHtml()}</div>
      <div class="row"><button id="c-save">${t('common.save')}</button></div>
    </div>`;
}

function render() {
  const confirmHtml = savedMsg
    ? `<div class="card"><p>${escapeHtml(savedMsg)}</p></div>`
    : (state ? confirmCardHtml() : '');
  root.innerHTML = `
    <div class="modal-overlay">
      <div class="modal-card">
        <div class="row between modal-head">
          <strong>${t('input.title')}</strong>
          <button id="add-close" class="icon-btn" title="${t('common.close')}">✕</button>
        </div>
        <p class="muted">${t('input.intro')}</p>
        <div class="input-row">
          <input id="raw" placeholder="${t('input.placeholder')}" value="${escapeHtml(state?.rawText || '')}">
          <button id="parse">${t('input.parse')}</button>
        </div>
        <div id="confirm">${confirmHtml}</div>
      </div>
    </div>`;
}

// подсветка выбранных кнопок — как радиокнопки, без перерисовки
function syncTypeButtons() {
  root.querySelectorAll('[data-kind]').forEach((b) => b.classList.toggle('on', b.dataset.kind === state.kind));
}

function syncGroupButtons() {
  root.querySelectorAll('[data-g]').forEach((b) => b.classList.toggle('on', b.dataset.g === state.group));
}

function syncKind() {
  root.querySelector('#c-kind').textContent = kindTitle(state.kind);
  root.querySelector('#c-hint').textContent = t(`type.hint.${state.kind}`);
  root.querySelector('#c-extra').innerHTML = extraHtml();
  syncTypeButtons();
}

export function openAddModal() {
  if (!root) {
    root = document.createElement('div');
    root.id = 'add-modal';
    document.body.appendChild(root);
    root.addEventListener('click', (e) => onClick(e));
    root.addEventListener('keydown', (e) => {
      if (e.target.id === 'raw' && e.key === 'Enter') parse();
    });
    root.addEventListener('change', (e) => {
      if (e.target.id === 'c-repeat') {
        const wrap = root.querySelector('#c-repeat-n-wrap');
        if (wrap) wrap.hidden = e.target.value !== 'every';
      }
      // группа наследуется от направления — выбирать вручную не нужно
      if (e.target.id === 'c-sphere' && e.target.value) {
        const sphere = state?.spheres.find((s) => s.id === e.target.value);
        if (sphere) {
          state.group = sphere.group;
          syncGroupButtons();
        }
      }
    });
    bindTimeMasks(root);
    // смена языка перерисовывает открытую модалку
    onChange(() => {
      if (isOpen()) render();
    });
  }
  state = null;
  savedMsg = null;
  render();
  root.querySelector('#raw')?.focus();
}

function isOpen() {
  return Boolean(root && root.innerHTML);
}

function closeModal() {
  state = null;
  savedMsg = null;
  if (root) root.innerHTML = '';
}

async function parse() {
  const rawEl = root.querySelector('#raw');
  const text = rawEl.value.trim();
  if (!text) return;
  const [parsed, spheres] = await Promise.all([categorize(text), getAllSpheres()]);
  // рутина из разбора — это продолжительное дело; сами рутины создаются на «Направлениях»
  const kind = parsed.kind === 'routine' ? 'ongoing' : parsed.kind;
  state = { parsed, kind, rawText: text, group: parsed.group || 'П', spheres };
  render();
  root.querySelector('#raw')?.focus();
}

async function save() {
  const confirmEl = root.querySelector('#confirm');
  const { rawText } = state;
  const title = confirmEl.querySelector('#c-title').value.trim();
  if (!title) return;
  const id = crypto.randomUUID();

  if (state.kind === 'sphere') {
    await saveSphere(new Sphere({ id, name: title, group: state.group }));
    savedMsg = t('spheres.saved', { title });
  } else {
    const dur = Number(confirmEl.querySelector('#c-dur').value) || 30;
    const sphereId = confirmEl.querySelector('#c-sphere')?.value || null;
    const repeatKind = confirmEl.querySelector('#c-repeat').value;
    const repeatN = Number(confirmEl.querySelector('#c-repeat-n')?.value) || 3;
    // продолжительное дело — то же разовое, но с повтором; после завершения
    // возвращается по расписанию (recurring)
    await saveTask(new Task({
      id,
      rawText,
      title,
      group: state.group,
      durationMin: dur,
      sphereId,
      dueAt: state.kind === 'task' ? readRemindInput(root, 'c') : null,
      status: 'todo',
      source: state.parsed.provider,
      repeatRule: state.kind === 'ongoing'
        ? (repeatKind === 'every' ? `every:${repeatN}` : 'daily')
        : (repeatKind === 'every' ? `every:${repeatN}` : (repeatKind || null)),
    }));
    const remindDate = root.querySelector('#c-remind-date')?.value;
    savedMsg = t('task.saved', { title, group: state.group })
      + (state.kind === 'task' && remindDate ? ` ${t('task.willRemind')}` : '');
  }
  state = null;
  render();
  // активный экран перерисуется с новыми данными (main.js слушает)
  document.dispatchEvent(new CustomEvent('data-changed'));
}

async function onClick(e) {
  if (e.target.classList.contains('modal-overlay') || e.target.closest('#add-close')) {
    closeModal();
    return;
  }
  if (handleRemindClick(root, e)) return;
  if (e.target.id === 'parse') {
    await parse();
    return;
  }
  const kindBtn = e.target.closest('[data-kind]');
  if (kindBtn && state) {
    state.kind = kindBtn.dataset.kind;
    syncKind();
    return;
  }
  const grp = e.target.closest('[data-g]');
  if (grp && state) {
    state.group = grp.dataset.g;
    syncGroupButtons();
    return;
  }
  // чип длительности: выбор вместо набора цифр
  const chip = e.target.closest('[data-dur]');
  if (chip) {
    const dur = root.querySelector('#c-dur');
    if (dur) dur.value = chip.dataset.dur;
    root.querySelectorAll('.chip[data-dur]').forEach((c) => c.classList.toggle('on', c === chip));
    return;
  }
  if (e.target.id === 'c-save' && state) await save();
}
