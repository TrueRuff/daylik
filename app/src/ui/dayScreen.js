// Экран «День»: собственный таймлайн (рутины и поставленные дела) вместо
// календарной сетки. Расстановка: тапом по пустому часу (основной способ,
// работает и на телефоне), перетаскиванием карточки, растягиванием за нижний
// край, кликом в колонке дел или автоматически.

import { getPractices, getTasks, updateTask, deleteTask, getAllSpheres, completeTask, savePractice, deletePractice, saveTask } from '../core/storage.js';
import { categorize } from '../core/categorize.js';
import { breakdownWithLlm } from '../ai/llmClient.js';
import { practiceAppliesOn, minutesToTime, timeToMinutes, tsToLocalInput, localInputToTs, todayStr, addDays } from '../core/schedule.js';
import {
  buildDay, computeFreeWindows, practicesToBlocks,
  adaptiveSort, autoPlaceLimit, recommendNow,
} from '../core/dayPlan.js';
import { GROUP_COLORS } from '../core/calendarEvents.js';
import { dayStats } from '../core/analytics.js';
import { Practice, Task } from '../core/models.js';
import { t, getLang, onChange } from '../core/i18n.js';
import { escapeHtml, daysCheckboxes, groupOptions, timeRangeFields, timeSelect } from './dom.js';

const ENERGY_KEY = 'daylik-energy';
const WELCOME_KEY = 'daylik-welcome';

const PX_PER_MIN = 64 / 60; // высота часа таймлайна, px
const MINUTES = 1440;

function fmtTime(min) {
  return `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(Math.round(min) % 60).padStart(2, '0')}`;
}

// Раскладка пересекающихся блоков по «дорожкам»: кластеры перекрытий
// нумеруются отдельно, дорожек в кластере — сколько нужно
function layoutBlocks(blocks) {
  const sorted = [...blocks].sort((a, b) => a.start - b.start);
  const out = [];
  let cluster = [];
  let clusterEnd = -1;
  const flush = () => {
    if (!cluster.length) return;
    const laneEnd = [];
    const laid = cluster.map((b) => {
      let lane = laneEnd.findIndex((e) => e <= b.start);
      if (lane === -1) lane = laneEnd.length;
      laneEnd[lane] = b.end;
      return { ...b, lane };
    });
    laid.forEach((b) => out.push({ ...b, lanes: laneEnd.length }));
    cluster = [];
    clusterEnd = -1;
  };
  for (const b of sorted) {
    if (cluster.length && b.start >= clusterEnd) flush();
    cluster.push(b);
    clusterEnd = Math.max(clusterEnd, b.end);
  }
  flush();
  return out;
}

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
  let pickAt = null;    // минута выбранного на таймлайне окна (выбор дела)
  let scrolledToNow = false;

  // Каркас живёт всё время экрана: шапка и колонка перерисовываются,
  // таймлайн перерисовывается вместе с ними
  root.innerHTML = `
    <div id="day-top"></div>
    <div class="day-wrap">
      <div id="cal-wrap"><div class="tl-scroll" id="tl-scroll"></div></div>
      <div class="side" id="side"></div>
    </div>
    <div id="day-modal" hidden></div>`;

  const topEl = root.querySelector('#day-top');
  const sideEl = root.querySelector('#side');
  const modalEl = root.querySelector('#day-modal');
  const scrollEl = root.querySelector('#tl-scroll');

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
        group: x.group,
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

    scrollEl.innerHTML = timelineHtml(layoutBlocks(blocks));
    // прокрутка к «сейчас»: на скрытом экране (под формой входа) scrollTop
    // не работает, поэтому ждём, пока экран реально виден
    if (!scrolledToNow && scrollEl.offsetHeight > 0) {
      scrolledToNow = true;
      scrollEl.scrollTop = Math.max(0, (nowMinutes() - 120) * PX_PER_MIN);
    }

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

    // карточки правки (дело, блок дня) и выбор дела на время живут в модальном окне
    const modalHtml = editTask
      ? editCardHtml(editTask, spheres)
      : (editPractice !== null
        ? routineEditorHtml(state.practices.find((p) => p.id === editPractice))
        : (pickAt !== null ? pickerHtml(pickAt) : ''));
    modalEl.hidden = !modalHtml;
    modalEl.innerHTML = modalHtml ? `<div class="modal-overlay"><div class="modal-card">${modalHtml}</div></div>` : '';

    sideEl.innerHTML = `
      <h3>${t('day.tasks')}</h3>
      ${unscheduled.length
        ? [...placeable, ...notFitting].map((x) => taskRowHtml(x, fits(x))).join('')
        : `<p class="muted">${t('day.noTasks')}</p>`}
      ${done.length ? `
      <details class="done-box">
        <summary>${t('day.doneCount', { n: done.length })}</summary>
        ${done.slice(0, 15).map((task) => `
          <button class="done-item" data-id="${task.id}" title="${t('task.return')}">
            <span class="badge g-${task.group}">${task.group}</span>${escapeHtml(task.title)}
          </button>`).join('')}
      </details>` : ''}`;
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
        <label>${t('task.startTime')}
          ${timeSelect('js-estart', task.scheduledDate === todayStr() && task.scheduledStart != null ? minutesToTime(task.scheduledStart) : '', true)}
          <span class="muted">${t('task.startTimeHint')}</span>
        </label>
        <details class="more-params" ${task.dueAt || task.repeatRule || task.sphereId ? 'open' : ''}>
          <summary>${t('task.moreParams')}</summary>
          <p class="muted">${t('task.moreParamsHint')}</p>
          <label>${t('task.remind')} <input id="e-remind" type="datetime-local" value="${tsToLocalInput(task.dueAt)}"></label>
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
          <label>${t('common.sphere')}
            <select id="e-sphere">
              <option value="">${t('task.noSphere')}</option>
              ${spheres.map((s) =>
                `<option value="${s.id}"${s.id === task.sphereId ? ' selected' : ''}>${escapeHtml(s.name)}</option>`).join('')}
            </select>
          </label>
        </details>
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

  // ---------- таймлайн дня ----------

  function timelineHtml(laid) {
    const hours = Array.from({ length: 24 }, (_, h) =>
      `<div class="tl-hour" style="top:${h * 60 * PX_PER_MIN}px"><span>${String(h).padStart(2, '0')}</span></div>`).join('');
    const cards = laid.map((b) => {
      const top = b.start * PX_PER_MIN;
      const height = (Math.min(b.end, MINUTES) - b.start) * PX_PER_MIN;
      const width = 100 / b.lanes;
      const left = b.lane * width;
      const style = `top:${top}px;height:${height}px;left:${left}%;width:calc(${width}% - 8px)`;
      if (b.kind === 'routine') {
        return `<div class="tl-card routine" data-practice="${b.id}" style="${style}">
          <span class="tl-time">${fmtTime(b.start)}–${fmtTime(Math.min(b.end, MINUTES))}</span>
          <span class="tl-title">↻ ${escapeHtml(b.label)}</span>
        </div>`;
      }
      return `<div class="tl-card task" data-task="${b.taskId}" data-g="${b.group}" style="${style};background:${GROUP_COLORS[b.group] ?? 'var(--accent)'}">
        <span class="tl-time">${fmtTime(b.start)}–${fmtTime(Math.min(b.end, MINUTES))}</span>
        <span class="tl-title">${escapeHtml(b.label)}</span>
        <span class="tl-resize" data-resize="${b.taskId}"></span>
      </div>`;
    }).join('');
    return `
      <div class="tl">
        <div class="tl-gutter">${hours}</div>
        <div class="tl-canvas" id="tl-canvas" title="${t('day.tapHint')}">${cards}
          <div class="tl-now" style="top:${nowMinutes() * PX_PER_MIN}px"></div>
        </div>
      </div>`;
  }

  // Выбор дела на выбранное время: основной способ расстановки — тап,
  // работает и мышью, и пальцем (drag — дополнение для мыши)
  function pickerHtml(startMin) {
    const fits = (x) => x.durationMin <= MINUTES - startMin;
    const list = [...adaptiveSort(state.unscheduled.filter(fits), energy),
      ...state.unscheduled.filter((x) => !fits(x))];
    return `
      <div class="card">
        <div class="row between">
          <strong>${t('day.placeAt', { time: fmtTime(startMin) })}</strong>
          <button id="pick-close" class="secondary">${t('common.close')}</button>
        </div>
        ${list.length ? list.map((x) => `
          <button class="pick-task" data-id="${x.id}">
            <span class="badge g-${x.group}">${x.group}</span>${escapeHtml(x.title)}
            <span class="muted">${x.durationMin} ${t('task.minutes')}${fits(x) ? '' : ` — ${t('day.notFit')}`}</span>
          </button>`).join('') : `<p class="muted">${t('day.pickEmpty')}</p>`}
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

  // ---------- таймлайн: тап-выбор, перенос и растягивание ----------

  function canvas() {
    return root.querySelector('#tl-canvas');
  }

  function minuteAt(e) {
    const r = canvas().getBoundingClientRect();
    const y = e.clientY - r.top + scrollEl.scrollTop;
    return Math.max(0, Math.min(MINUTES - 1, y / PX_PER_MIN));
  }

  let gesture = null;    // активный жест на карточке дела
  let skipTlClick = false; // клик после перетаскивания подавляется

  root.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || editing || editPractice || pickAt !== null) return;
    const resize = e.target.closest('.tl-resize');
    const card = e.target.closest('.tl-card.task');
    if (!card) return;
    const block = state?.blocks.find((b) => b.taskId === card.dataset.task);
    if (!block) return;
    gesture = {
      type: resize ? 'resize' : 'move',
      id: block.taskId,
      startY: e.clientY,
      startMin: block.start,
      durMin: block.end - block.start,
      moved: false,
      card,
    };
    try {
      card.setPointerCapture(e.pointerId);
    } catch {
      // события всё равно всплывут до root
    }
  });

  root.addEventListener('pointermove', (e) => {
    if (!gesture) return;
    if (!gesture.moved && Math.abs(e.clientY - gesture.startY) < 6) return;
    if (!gesture.moved) gesture.moved = true;
    const delta = Math.round((e.clientY - gesture.startY) / PX_PER_MIN);
    if (gesture.type === 'move') {
      const ns = Math.max(0, Math.min(MINUTES - gesture.durMin, Math.round((gesture.startMin + delta) / 5) * 5));
      gesture.newStart = ns;
      gesture.card.style.transform = `translateY(${(ns - gesture.startMin) * PX_PER_MIN}px)`;
      gesture.card.style.opacity = '.85';
    } else {
      const nd = Math.max(5, Math.min(480, Math.round((gesture.durMin + delta) / 5) * 5));
      gesture.newDur = nd;
      gesture.card.style.height = `${nd * PX_PER_MIN}px`;
    }
  });

  root.addEventListener('pointerup', async () => {
    if (!gesture) return;
    const g = gesture;
    gesture = null;
    if (!g.moved) return; // клик без движения — откроется карточкой редактирования
    skipTlClick = true;
    setTimeout(() => { skipTlClick = false; }, 80);
    g.card.style.transform = '';
    g.card.style.opacity = '';
    if (g.type === 'move' && g.newStart !== undefined && g.newStart !== g.startMin) {
      await updateTask(g.id, { scheduledStart: g.newStart });
      whatNow = null;
    } else if (g.type === 'resize' && g.newDur !== undefined && g.newDur !== g.durMin) {
      await updateTask(g.id, { durationMin: g.newDur });
      whatNow = null;
    }
    render();
  });

  root.addEventListener('pointercancel', () => {
    if (!gesture) return;
    gesture.card.style.transform = '';
    gesture.card.style.opacity = '';
    gesture = null;
  });

  scrollEl.addEventListener('click', async (e) => {
    if (skipTlClick) return;
    const card = e.target.closest('.tl-card');
    if (card) {
      if (card.classList.contains('routine')) {
        editPractice = card.dataset.practice;
      } else {
        editing = card.dataset.task;
      }
      pickerToTop();
      render();
      return;
    }
    // тап по пустому месту: выбрать дело на это время (шаг 15 мин)
    if (e.target.closest('#tl-canvas')) {
      const min = Math.round(minuteAt(e) / 15) * 15;
      pickAt = Math.min(min, MINUTES - 15);
      render();
    }
  });

  // смена языка перерисовывает экран целиком (main.js)
  onChange(() => render());

  function pickerToTop() {
    root.closest('main')?.scrollTo?.({ top: 0, behavior: 'smooth' });
  }

  // ---------- обработчики ----------

  root.addEventListener('click', async (e) => {
    if (e.target.classList.contains('modal-overlay')) {
      editing = null;
      editPractice = null;
      pickAt = null;
      render();
      return;
    }

    if (e.target.closest('#pick-close')) {
      pickAt = null;
      render();
      return;
    }

    const pick = e.target.closest('.pick-task');
    if (pick && pickAt !== null) {
      await updateTask(pick.dataset.id, { scheduledDate: state.date, scheduledStart: pickAt });
      pickAt = null;
      whatNow = null;
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
      // ручное время начала: указано — поставить на сегодня; «—» — снять
      const startVal = root.querySelector('.js-estart')?.value;
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
