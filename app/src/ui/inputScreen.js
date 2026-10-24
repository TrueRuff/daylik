// Экран «Ввод»: свободный текст → разбор → подтверждение типа и группы → сохранение

import { categorize } from '../core/categorize.js';
import { Task, Sphere, Practice, GROUP_TITLES } from '../core/models.js';
import { saveTask, saveSphere, savePractice, getAllSpheres } from '../core/storage.js';
import { DAY_NAMES, timeToMinutes, localInputToTs } from '../core/schedule.js';
import { escapeHtml } from './dom.js';

const KIND_TITLES = { sphere: 'Сфера', task: 'Дело', routine: 'Практика' };

function providerTitle(parsed) {
  if (parsed.provider === 'llm') return 'разобрано через API';
  return parsed.llmFailed ? 'по словарю — API недоступно' : 'разобрано по словарю';
}

export function initInputScreen(root) {
  let state = null;

  root.innerHTML = `
    <h2>Ввод</h2>
    <p class="muted">Опиши задуманное своими словами — приложение предложит тип и группу, остаётся подтвердить.</p>
    <div class="input-row">
      <input id="raw" placeholder="например: хочу научиться готовить">
      <button id="parse">Разобрать</button>
    </div>
    <div id="confirm"></div>`;

  const rawEl = root.querySelector('#raw');
  const confirmEl = root.querySelector('#confirm');

  root.querySelector('#parse').addEventListener('click', parse);
  rawEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') parse();
  });

  async function parse() {
    const text = rawEl.value.trim();
    if (!text) return;
    const [parsed, spheres] = await Promise.all([categorize(text), getAllSpheres()]);
    state = { parsed, rawText: text, group: parsed.group || 'П', spheres };
    renderConfirm();
  }

  function renderConfirm() {
    const { parsed } = state;
    confirmEl.innerHTML = `
      <div class="card">
        <div class="row between">
          <strong>${KIND_TITLES[parsed.kind]}</strong>
          <span class="muted">${providerTitle(parsed)}</span>
        </div>
        <label>Название <input id="c-title" value="${escapeHtml(parsed.title)}"></label>
        <div class="row">
          Группа:
          ${['Н', 'Ж', 'П'].map((g) =>
            `<button class="grp${g === state.group ? ' on' : ''}" data-g="${g}">${g} — ${GROUP_TITLES[g]}</button>`).join('')}
        </div>
        ${parsed.kind === 'routine' ? `
        <div class="row">
          <label>Начало <input id="c-start" type="time" value="09:00"></label>
          <label>Конец <input id="c-end" type="time" value="10:00"></label>
        </div>
        <div class="days">
          ${DAY_NAMES.map((d, i) => `<label class="day"><input type="checkbox" data-day="${i + 1}" checked>${d}</label>`).join('')}
        </div>` : ''}
        ${parsed.kind === 'task' ? `
        <div class="row">
          <label>Длительность, мин <input id="c-dur" type="number" min="5" step="5" value="${parsed.durationMin || 30}"></label>
          <label>Напомнить (необязательно) <input id="c-remind" type="datetime-local"></label>
        </div>
        <label>Сфера
          <select id="c-sphere">
            <option value="">без сферы</option>
            ${state.spheres.map((s) => `<option value="${s.id}">${escapeHtml(s.name)}</option>`).join('')}
          </select>
        </label>` : ''}
        <div class="row"><button id="c-save">Сохранить</button></div>
      </div>`;
  }

  confirmEl.addEventListener('click', async (e) => {
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
      saved(`Сфера «${title}» сохранена. Описание можно заполнить в разделе «Сферы».`);
    } else if (parsed.kind === 'routine') {
      const days = [...confirmEl.querySelectorAll('.days input:checked')].map((c) => Number(c.dataset.day));
      await savePractice(new Practice({
        id,
        title,
        days,
        start: timeToMinutes(confirmEl.querySelector('#c-start').value || '09:00'),
        end: timeToMinutes(confirmEl.querySelector('#c-end').value || '10:00'),
      }));
      saved(`Практика «${title}» сохранена, она появится в расписании дня.`);
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
      saved(`Дело «${title}» сохранено, группа ${state.group}.${remind ? ' Напомню в срок.' : ''}`);
    }
  });

  function saved(text) {
    confirmEl.innerHTML = `<div class="card"><p>${escapeHtml(text)}</p></div>`;
    rawEl.value = '';
    state = null;
  }
}
