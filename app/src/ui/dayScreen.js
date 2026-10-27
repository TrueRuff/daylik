// Экран «День»: календарь FullCalendar (вид день) — рутины и поставленные
// дела. Расстановка: перетаскиванием из колонки дел, перенос/растягивание
// событий, кликом (первое подходящее окно) или автоматически.

import { Calendar } from '@fullcalendar/core';
import timeGridPlugin from '@fullcalendar/timegrid';
import { Draggable } from '@fullcalendar/interaction';
import ruLocale from '@fullcalendar/core/locales/ru';
import enLocale from '@fullcalendar/core/locales/en-gb';
import { getPractices, getTasks, updateTask, deleteTask, getAllSpheres, completeTask, savePractice, deletePractice, saveTask } from '../core/storage.js';
import { categorize } from '../core/categorize.js';
import { breakdownWithLlm } from '../ai/llmClient.js';
import { practiceAppliesOn, minutesToTime, timeToMinutes, tsToLocalInput, localInputToTs, todayStr, addDays } from '../core/schedule.js';
import {
  buildDay, computeFreeWindows, practicesToBlocks,
  adaptiveSort, autoPlaceLimit, recommendNow,
} from '../core/dayPlan.js';
import { eventsForRange, GROUP_COLORS } from '../core/calendarEvents.js';
import { dayStats } from '../core/analytics.js';
import { Practice, Task } from '../core/models.js';
import { t, getLang, onChange } from '../core/i18n.js';
import { escapeHtml, daysCheckboxes, groupOptions, timeRangeFields } from './dom.js';

const ENERGY_KEY = 'daylik-energy';
const WELCOME_KEY = 'daylik-welcome';

function todayWeekday() {
  return ((new Date().getDay() + 6) % 7) + 1; // 1 = понедельник
}

function loadEnergy() {
  try {
    return localStorage.getItem(ENERGY_KEY) || 'normal';
  } catch {
    return 'normal';
  }
}

function saveEnergy(v) {
  try {
    localStorage.setItem(ENERGY_KEY, v);
  } catch {
    // сохранение не критично
  }
}

// короткая инструкция показывается один раз; если хранилище недоступно —
// не показываем, чтобы не раздражать постоянной карточкой
function welcomeSeen() {
  try {
    return localStorage.getItem(WELCOME_KEY) === '1';
  } catch {
    return true;
  }
}

function nowMinutes() {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

export function initDayScreen(root) {
  let editing = null;   // id редактируемого дела
  let state = null;     // данные текущей отрисовки
  let energy = loadEnergy();
  let whatNow = null;   // рекомендация «что сейчас»
  let editPractice = null; // id редактируемого блока дня (рутины)
  let calendar = null;
  let currentEvents = [];

  // Каркас живёт всё время экрана: шапка и колонка перерисовываются,
  // календарь (FullCalendar) не пересоздаётся — только обновляет события
  root.innerHTML = `
    <div id="day-top"></div>
    <div class="day-wrap">
      <div id="cal-wrap"><div id="cal"></div></div>
      <div class="side" id="side"></div>
    </div>
    <div id="day-modal" hidden></div>`;

  const topEl = root.querySelector('#day-top');
  const sideEl = root.querySelector('#side');
  const modalEl = root.querySelector('#day-modal');

  // ---------- сбор данных и отрисовка ----------

  async function render() {
    const date = todayStr();
    const practices = (await getPractices()).filter((p) => practiceAppliesOn(p, todayWeekday()));

    const todo = await getTasks({ status: 'todo' });
    const done = (await getTasks({ status: 'done' })).sort((a, b) => b.createdAt - a.createdAt);
    const spheres = await getAllSpheres();
    const allTasks = [...todo, ...done];
    const editTask = editing ? allTasks.find((x) => x.id === editing) : null;
    if (editing && !editTask) editing = null;
    // запланированное = дата + конкретное время; отложенное «на завтра» без
    // времени завтра вернётся в колонку дел, а не сломает календарь
    const scheduled = todo
      .filter((x) => x.scheduledDate === date && x.scheduledStart != null)
      .sort((a, b) => a.scheduledStart - b.scheduledStart);
    // сегодняшняя колонка дел: без даты или «на сегодня без времени»;
    // завтрашние не давят, вчерашние живут в баннере хвостов
    const unscheduled = todo.filter((x) => !x.scheduledDate || (x.scheduledDate === date && x.scheduledStart == null));

    const blocks = [
      ...practicesToBlocks(practices).map((r) => ({ ...r, kind: 'routine' })),
      ...scheduled.map((x) => ({
        start: x.scheduledStart,
        end: x.scheduledStart + x.durationMin,
        kind: 'task',
        label: x.title,
        taskId: x.id,
      })),
    ].sort((a, b) => a.start - b.start);

    const windows = computeFreeWindows(blocks);
    const fits = (x) => windows.some((w) => w.end - w.start >= x.durationMin);
    const placeable = adaptiveSort(unscheduled.filter(fits), energy);
    const notFitting = unscheduled.filter((x) => !fits(x));
    const overdue = todo.filter((x) => x.scheduledDate && x.scheduledDate < date);
    const routines = practices.map((p) => ({ start: p.start, end: p.end, label: p.title }));
    const stats = dayStats(date, todo, done, practices);
    const fmt = (min) => `${Math.floor(min / 60)}ч ${String(min % 60).padStart(2, '0')}м`;

    state = { date, routines, scheduled, unscheduled, blocks, windows, allTasks, practices, todo,
      sphereNames: Object.fromEntries(spheres.map((s) => [s.id, s.name])) };

    currentEvents = eventsForRange(date, date, practices, scheduled);
    calendar?.refetchEvents();

    // шапка дня: «Сегодня» + локализованная дата
    const dateLabel = new Date().toLocaleDateString(getLang() === 'en' ? 'en-GB' : 'ru-RU',
      { weekday: 'long', day: 'numeric', month: 'long' });

    topEl.innerHTML = `
      <div class="day-head">
        <div>
          <h2>${t('day.title')}</h2>
          <p class="day-date">${dateLabel}</p>
        </div>
        <button id="what-now">${t('day.whatNow')}</button>
      </div>
      ${welcomeSeen() ? '' : `
      <div class="card welcome">
        <strong>${t('welcome.title')}</strong>
        <ol>
          <li>${t('welcome.step1')}</li>
          <li>${t('welcome.step2')}</li>
          <li>${t('welcome.step3')}</li>
        </ol>
        <button id="welcome-ok">${t('welcome.ok')}</button>
      </div>`}
      <div class="input-row">
        <input id="quick-add" placeholder="${t('day.quickAdd')}">
        <button id="quick-save" class="secondary">+</button>
      </div>
      <p id="quick-msg" class="muted"></p>
      <div class="row between">
        <span class="muted">${t('energy.label')}:
          ${['low', 'normal', 'high'].map((e) =>
            `<button class="grp energy${e === energy ? ' on' : ''}" data-energy="${e}">${t(`energy.${e}`)}</button>`).join('')}
        </span>
        <button id="auto-place" class="secondary">${t('day.autoPlace')}</button>
      </div>
      <p class="muted">${stats.summary}${todo.length || routines.length ? '' : ` — ${t('day.emptyHint')}`}</p>
      ${stats.overloadMin > 0 ? `<p class="overload">${t('day.overload', { time: fmt(stats.overloadMin) })}</p>` : ''}
      ${overdue.length ? `
      <div class="card overdue-box">
        <span>${t('day.overdue', { n: overdue.length })}</span>
        <button id="overdue-return" class="secondary">${t('day.overdueReturn')}</button>
      </div>` : ''}
      ${whatNow === 'empty' ? `<div class="card"><p class="muted">${t('day.whatNowEmpty')}</p></div>` : whatNow ? whatNowHtml(whatNow) : ''}`;

    // карточки правки (дело, блок дня) живут в модальном окне поверх экрана
    const modalHtml = editTask
      ? editCardHtml(editTask, spheres)
      : (editPractice !== null
        ? routineEditorHtml(state.practices.find((p) => p.id === editPractice))
        : '');
    modalEl.hidden = !modalHtml;
    modalEl.innerHTML = modalHtml ? `<div class="modal-overlay"><div class="modal-card">${modalHtml}</div></div>` : '';

    sideEl.innerHTML = `
      <h3>${t('day.tasks')}</h3>
      ${unscheduled.length
        ? [...placeable, ...notFitting].map((x) => taskRowHtml(x, fits(x))).join('')
        : `<p class="muted">${t('day.noTasks')}</p>`}
      <details class="done-box" ${done.length ? '' : ''}>
        <summary>${t('day.doneCount', { n: done.length })}</summary>
      ${done.length
        ? done.slice(0, 15).map((task) => `
          <button class="done-item" data-id="${task.id}" title="${t('task.return')}">
            <span class="badge g-${task.group}">${task.group}</span>${escapeHtml(task.title)}
          </button>`).join('')
        : `<p class="muted">${t('day.nothingDone')}</p>`}
      </details>`;
  }

  // Общая подпись дела: бейдж группы, название, длительность, метка направления
  const taskLabel = (task, suffix = '') =>
    `<span class="badge g-${task.group}">${task.group}</span>${escapeHtml(task.title)} <span class="muted">${task.durationMin} ${t('task.minutes')}`
    + (task.sphereId && state.sphereNames[task.sphereId] ? ` · ${escapeHtml(state.sphereNames[task.sphereId])}` : '')
    + `${suffix}</span>`;

  function taskRowHtml(task, canPlace) {
    // не влезающее дело остаётся кликабельным — встанет в первое окно
    // с перекрытием (оценка времени приблизительна, это нормально)
    const label = taskLabel(task, canPlace ? '' : ` — ${t('day.notFit')}`);
    return `
      <div class="task-row${canPlace ? '' : ' dimmed'}" data-id="${task.id}" data-g="${task.group}">
        <button class="side-task" data-id="${task.id}"
          title="${canPlace ? t('task.putFirst') : t('task.putOverlap')}">${label}</button>
        <button class="edit-btn" data-id="${task.id}" title="${t('task.editTip')}">✎</button>
        <button class="done-btn" data-id="${task.id}" title="${t('task.markDone')}">✓</button>
      </div>`;
  }

  function editCardHtml(task, spheres) {
    return `
      <div class="card">
        <div class="row between">
          <strong>${t('task.edit')}</strong>
          <button id="edit-close" class="secondary">${t('common.close')}</button>
        </div>
        <label>${t('common.title')} <input id="e-title" value="${escapeHtml(task.title)}"></label>
        <div class="row">
          <label>${t('task.duration')} <input id="e-dur" type="number" min="5" max="480" step="5" value="${task.durationMin}"></label>
          <label>${t('common.group')}
            <select id="e-group">${groupOptions(task.group)}</select>
          </label>
        </div>
        <label>${t('common.sphere')}
          <select id="e-sphere">
            <option value="">${t('task.noSphere')}</option>
            ${spheres.map((s) =>
              `<option value="${s.id}"${s.id === task.sphereId ? ' selected' : ''}>${escapeHtml(s.name)}</option>`).join('')}
          </select>
        </label>
        <label>${t('task.remind')} <input id="e-remind" type="datetime-local" value="${tsToLocalInput(task.dueAt)}"></label>
        <label>${t('task.startTime')}
          <input id="e-start" type="time" step="300" value="${task.scheduledDate === todayStr() && task.scheduledStart != null ? minutesToTime(task.scheduledStart) : ''}">
          <span class="muted">${t('task.startTimeHint')}</span>
        </label>
        <div class="row">
          <label>${t('repeat.label')}
            <select id="e-repeat">
              <option value="">${t('repeat.none')}</option>
              <option value="daily"${task.repeatRule === 'daily' ? ' selected' : ''}>${t('repeat.daily')}</option>
              <option value="weekly"${task.repeatRule === 'weekly' ? ' selected' : ''}>${t('repeat.weekly')}</option>
              <option value="every"${/^every:/.test(task.repeatRule || '') ? ' selected' : ''}>${t('repeat.every')}</option>
            </select>
          </label>
          <label id="e-repeat-n-wrap" hidden>${t('repeat.everyDays')} <input id="e-repeat-n" type="number" min="2" max="30" value="${(/^every:(\d+)/.exec(task.repeatRule || '') || [])[1] || 3}"></label>
        </div>
        <div class="row">
          <button id="e-save" data-id="${task.id}">${t('common.save')}</button>
          <button id="e-tomorrow" data-id="${task.id}" class="secondary">${t('task.tomorrow')}</button>
          <button id="e-delete" data-id="${task.id}" class="danger">${t('task.deleteBtn')}</button>
        </div>
        ${task.durationMin >= 60 ? `
        <div class="row">
          <button id="e-breakdown" data-id="${task.id}" class="secondary">${t('task.breakdown')}</button>
          <span id="e-msg" class="muted"></span>
        </div>` : ''}
      </div>`;
  }

  // Карточка блока дня: правка существующей рутины (создание — на «Направлениях»)
  function routineEditorHtml(p) {
    return `
      <div class="card">
        <div class="row between">
          <strong>${t('routine.edit')}</strong>
          <button id="routine-close" class="secondary">${t('common.close')}</button>
        </div>
        <p class="muted">${t('routine.hint')}</p>
        <label>${t('common.title')} <input id="r-title" value="${escapeHtml(p?.title || '')}" placeholder="${t('input.placeholder')}"></label>
        ${timeRangeFields(p ? minutesToTime(p.start) : '23:00', p ? minutesToTime(p.end) : '07:00')}
        <div class="days">${daysCheckboxes(p?.days)}</div>
        <div class="row">
          <button id="routine-save" data-id="${p?.id || ''}">${t('common.save')}</button>
          ${p ? `<button id="routine-delete" data-id="${p.id}" class="danger">${t('common.delete')}</button>` : ''}
        </div>
      </div>`;
  }

  function whatNowHtml(rec) {
    return `
      <div class="card">
        <div class="row between">
          <span>${t('day.whatNowHint', {
            b: minutesToTime(rec.end),
            title: rec.task.title,
            dur: rec.task.durationMin,
          })}</span>
          <button id="whatnow-close" class="secondary">${t('common.close')}</button>
        </div>
        <div class="row">
          <button id="whatnow-place" data-id="${rec.task.id}" data-start="${rec.start}">${t('day.whatNowPlace')} ${minutesToTime(rec.start)}</button>
        </div>
      </div>`;
  }

  async function autoPlace() {
    const { date, routines, scheduled, unscheduled } = state;
    const occupancy = [
      ...routines,
      ...scheduled.map((x) => ({ start: x.scheduledStart, end: x.scheduledStart + x.durationMin, label: x.title })),
    ];
    const limit = autoPlaceLimit(energy);
    const batch = adaptiveSort(unscheduled, energy).slice(0, limit);
    const plan = buildDay(date, occupancy, batch, { sort: (xs) => adaptiveSort(xs, energy) });
    for (const b of plan.blocks.filter((x) => x.kind === 'task')) {
      await updateTask(b.taskId, { scheduledDate: date, scheduledStart: b.start });
    }
    whatNow = null;
    render();
  }

  // ---------- календарь FullCalendar ----------

  // Локаль — единственная опция, которую нельзя менять на лету: при смене
  // языка календарь пересоздаётся (события подтянутся через events-функцию)
  function buildCalendar() {
    calendar?.destroy();
    calendar = new Calendar(root.querySelector('#cal'), {
      plugins: [timeGridPlugin],
      initialView: 'timeGridDay',
      locale: getLang() === 'en' ? enLocale : ruLocale,
      headerToolbar: false,
      allDaySlot: false,
      slotMinTime: '00:00:00',
      slotMaxTime: '24:00:00',
      slotDuration: '00:30:00',
      slotLabelInterval: '01:00:00',
      dayHeaderFormat: { weekday: 'long', day: 'numeric', month: 'long' },
      height: 780,
      scrollTime: minutesToTime(Math.max(0, nowMinutes() - 90)),
      nowIndicator: true,
      snapDuration: '00:05:00',
      events: (info, success) => success(currentEvents),
      editable: true,   // перенос и ресайз стоящих событий
      droppable: true,  // приём дел, перетянутых из колонки (eventReceive)
  
      // перенос дела: сохраняем новое время начала
      eventDrop: async (info) => {
        const { kind, taskId } = info.event.extendedProps;
        if (kind !== 'task') {
          info.revert();
          return;
        }
        const start = info.event.start;
        await updateTask(taskId, { scheduledDate: state.date, scheduledStart: start.getHours() * 60 + start.getMinutes() });
        whatNow = null;
        render();
      },
  
    // растягивание дела: меняем длительность (шаг 5 мин, в границах модели 5–480)
    eventResize: async (info) => {
      const { kind, taskId } = info.event.extendedProps;
      if (kind !== 'task') {
        info.revert();
        return;
      }
      const dur = Math.round((info.event.end - info.event.start) / 300000); // 5-мин интервалы
      if (dur < 1 || dur > 96) {
        info.revert();
        return;
      }
        await updateTask(taskId, { durationMin: dur * 5 });
        whatNow = null;
        render();
      },
  
      // клик по событию: дело — карточка редактирования, рутина — редактор блока
      eventClick: (info) => {
        const { kind, taskId, practiceId } = info.event.extendedProps;
        if (kind === 'task') {
          editing = taskId;
          pickerToTop();
        } else if (practiceId) {
          editPractice = practiceId;
          pickerToTop();
        }
        render();
      },
  
      // бросок из колонки дел: ставим дело на полученное время
      eventReceive: async (info) => {
        const id = info.draggedEl.dataset.id;
        info.event.remove();
        const start = info.event.start;
        if (id && start) {
          await updateTask(id, { scheduledDate: state.date, scheduledStart: start.getHours() * 60 + start.getMinutes() });
          whatNow = null;
        }
        render();
      },
    });
    calendar.render();
  }

  buildCalendar();
  // смена языка пересоздаёт календарь с новой локалью (main.js перерисует
  // активный экран, события подтянутся заново через events-функцию)
  onChange(() => buildCalendar());

  // дела из колонки тянутся в календарь (FullCalendar Draggable)
  new Draggable(sideEl, {
    itemSelector: '.task-row',
    eventData: (el) => {
      const task = (state?.allTasks || []).find((x) => x.id === el.dataset.id);
      if (!task) return {};
      return {
        title: `${task.group} · ${task.title}`,
        duration: { minutes: task.durationMin },
        backgroundColor: GROUP_COLORS[task.group] ?? undefined,
      };
    },
  });

  function pickerToTop() {
    root.closest('main')?.scrollTo?.({ top: 0, behavior: 'smooth' });
  }

  // ---------- обработчики ----------

  root.addEventListener('click', async (e) => {
    if (e.target.classList.contains('modal-overlay')) {
      editing = null;
      editPractice = null;
      render();
      return;
    }

    if (e.target.closest('#auto-place')) {
      await autoPlace();
      return;
    }

    const energyBtn = e.target.closest('[data-energy]');
    if (energyBtn) {
      energy = energyBtn.dataset.energy;
      saveEnergy(energy);
      whatNow = null;
      render();
      return;
    }

    if (e.target.closest('#what-now')) {
      const rec = recommendNow(state.windows, state.unscheduled, nowMinutes(), energy);
      whatNow = rec || 'empty';
      render();
      return;
    }

    if (e.target.closest('#whatnow-close')) {
      whatNow = null;
      render();
      return;
    }

    if (e.target.closest('#welcome-ok')) {
      try {
        localStorage.setItem(WELCOME_KEY, '1');
      } catch {
        // сохранение не критично
      }
      render();
      return;
    }

    if (e.target.closest('#routine-close')) {
      editPractice = null;
      render();
      return;
    }

    if (e.target.id === 'routine-save') {
      const title = root.querySelector('#r-title').value.trim();
      const days = [...root.querySelectorAll('.days input:checked')].map((c) => Number(c.dataset.day));
      if (!title || !days.length) return;
      const old = state.practices.find((p) => p.id === e.target.dataset.id);
      const card = e.target.closest('.card');
      await savePractice(new Practice({
        id: e.target.dataset.id || crypto.randomUUID(),
        sphereId: old?.sphereId ?? null,
        title,
        days,
        start: timeToMinutes(card.querySelector('.js-start').value || '23:00'),
        end: timeToMinutes(card.querySelector('.js-end').value || '07:00'),
      }));
      editPractice = null;
      render();
      return;
    }

    if (e.target.id === 'routine-delete') {
      await deletePractice(e.target.dataset.id);
      editPractice = null;
      render();
      return;
    }

    const place = e.target.closest('#whatnow-place');
    if (place) {
      await updateTask(place.dataset.id, { scheduledDate: state.date, scheduledStart: Number(place.dataset.start) });
      whatNow = null;
      render();
      return;
    }

    if (e.target.closest('#overdue-return')) {
      const overdue = state.allTasks.filter((x) => x.status === 'todo' && x.scheduledDate && x.scheduledDate < state.date);
      for (const x of overdue) {
        await updateTask(x.id, { scheduledDate: null, scheduledStart: null });
      }
      render();
      return;
    }

    if (e.target.closest('#quick-save')) {
      await quickAdd();
      return;
    }

    if (e.target.closest('#edit-close')) {
      editing = null;
      render();
      return;
    }

    if (e.target.id === 'e-save') {
      const x = state.allTasks.find((y) => y.id === e.target.dataset.id);
      const repeatKind = root.querySelector('#e-repeat').value;
      const repeatN = Number(root.querySelector('#e-repeat-n')?.value) || 3;
      const patch = {
        title: root.querySelector('#e-title').value.trim(),
        durationMin: Number(root.querySelector('#e-dur').value) || 30,
        group: root.querySelector('#e-group').value,
        sphereId: root.querySelector('#e-sphere').value || null,
        dueAt: localInputToTs(root.querySelector('#e-remind').value),
        repeatRule: repeatKind === 'every' ? `every:${repeatN}` : (repeatKind || null),
      };
      if (!patch.title) return;
      // ручное время начала: указано — поставить на сегодня; очищено — снять
      const startVal = root.querySelector('#e-start')?.value;
      if (startVal) {
        patch.scheduledDate = state.date;
        patch.scheduledStart = timeToMinutes(startVal);
      } else if (x.scheduledDate === state.date) {
        patch.scheduledDate = null;
        patch.scheduledStart = null;
      }
      // длительность может перестать влезать в окно — место сохраняется:
      // перекрытие остаётся осознанным решением пользователя
      await updateTask(x.id, patch);
      editing = null;
      render();
      return;
    }

    if (e.target.id === 'e-tomorrow') {
      const x = state.allTasks.find((y) => y.id === e.target.dataset.id);
      if (x) await updateTask(x.id, { scheduledDate: addDays(state.date, 1) });
      editing = null;
      render();
      return;
    }

    if (e.target.id === 'e-breakdown') {
      const x = state.allTasks.find((y) => y.id === e.target.dataset.id);
      if (!x) return;
      const msg = root.querySelector('#e-msg');
      if (msg) msg.textContent = '…';
      const steps = await breakdownWithLlm(x.title);
      if (!steps) {
        if (msg) msg.textContent = t('task.breakdownFailed');
        return;
      }
      const stepDur = Math.min(30, Math.max(10, Math.round(x.durationMin / steps.length / 5) * 5));
      for (const step of steps) {
        await saveTask(new Task({
          id: crypto.randomUUID(),
          title: step,
          group: x.group,
          sphereId: x.sphereId,
          durationMin: stepDur,
          status: 'todo',
          source: 'llm',
        }));
      }
      await deleteTask(x.id);
      editing = null;
      render();
      const quickMsg = root.querySelector('#quick-msg');
      if (quickMsg) quickMsg.textContent = t('task.brokenInto', { n: steps.length });
      return;
    }

    if (e.target.id === 'e-delete') {
      await deleteTask(e.target.dataset.id);
      editing = null;
      render();
      return;
    }

    const editBtn = e.target.closest('.edit-btn');
    if (editBtn) {
      editing = editBtn.dataset.id;
      pickerToTop();
      render();
      return;
    }

    const doneBtn = e.target.closest('.done-btn');
    if (doneBtn) {
      const task = state.allTasks.find((x) => x.id === doneBtn.dataset.id);
      if (task) await completeTask(task);
      render();
      return;
    }

    const doneItem = e.target.closest('.done-item');
    if (doneItem) {
      await updateTask(doneItem.dataset.id, { status: 'todo' });
      render();
      return;
    }

    const side = e.target.closest('.side-task');
    if (side) {
      const task = state.unscheduled.find((x) => x.id === side.dataset.id);
      if (!task) return;
      // влезающее — в первое подходящее окно; длиннее окон — в первое окно
      // вообще, с перекрытием (оценка приблизительна)
      const w = state.windows.find((x) => x.end - x.start >= task.durationMin) || state.windows[0];
      if (w) {
        await updateTask(task.id, { scheduledDate: state.date, scheduledStart: w.start });
        whatNow = null;
        render();
      }
      return;
    }
  });

  root.addEventListener('change', (e) => {
    if (e.target.id === 'e-repeat') {
      const wrap = root.querySelector('#e-repeat-n-wrap');
      if (wrap) wrap.hidden = e.target.value !== 'every';
    }
  });

  root.addEventListener('keydown', (e) => {
    if (e.target.id === 'quick-add' && e.key === 'Enter') quickAdd();
  });

  // Быстрый ввод с экрана дня: тот же гибридный разбор, дело создаётся сразу
  async function quickAdd() {
    const input = root.querySelector('#quick-add');
    const msg = root.querySelector('#quick-msg');
    const text = input.value.trim();
    if (!text) return;

    const parsed = await categorize(text);
    if (parsed.kind !== 'task') {
      msg.textContent = t('day.quickKindHint');
      return;
    }
    await saveTask(new Task({
      id: crypto.randomUUID(),
      rawText: text,
      title: parsed.title,
      group: parsed.group || 'Н',
      durationMin: parsed.durationMin || 30,
      status: 'todo',
      source: parsed.provider,
    }));
    input.value = '';
    if (msg) msg.textContent = '';
    render();
  }

  document.addEventListener('tab-shown', (e) => {
    if (e.detail === 'day') render();
  });

  render();
}
