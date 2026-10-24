// Экран «День»: таймлайн 00:00–24:00 — рутины, поставленные дела, свободные окна.
// Расстановка: перетаскиванием (drag'n'drop), кликом в окно или автоматически.

import { getPractices, getTasks, updateTask, deleteTask, getAllSpheres } from '../core/storage.js';
import { practiceAppliesOn, minutesToTime, tsToLocalInput, localInputToTs } from '../core/schedule.js';
import { buildDay, computeFreeWindows, sortCandidates, canPlaceAt } from '../core/dayPlan.js';
import { t } from '../core/i18n.js';
import { escapeHtml } from './dom.js';

const PX_PER_MIN = 0.8;
const DRAG_THRESHOLD = 6; // px, отличаем перетаскивание от клика
const SNAP_MIN = 5;       // сетка таймлайна, минуты

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function todayWeekday() {
  return ((new Date().getDay() + 6) % 7) + 1; // 1 = понедельник
}

export function initDayScreen(root) {
  let picker = null; // окно, для которого открыт выбор дела
  let editing = null; // id редактируемого дела
  let state = null;   // данные текущей отрисовки
  let drag = null;    // активное перетаскивание

  async function render() {
    const date = todayStr();
    const practices = (await getPractices()).filter((p) => practiceAppliesOn(p, todayWeekday()));
    const routines = practices.map((p) => ({ start: p.start, end: p.end, label: p.title }));

    const todo = await getTasks({ status: 'todo' });
    const done = (await getTasks({ status: 'done' })).sort((a, b) => b.createdAt - a.createdAt);
    const spheres = await getAllSpheres();
    const allTasks = [...todo, ...done];
    const editTask = editing ? allTasks.find((x) => x.id === editing) : null;
    if (editing && !editTask) editing = null;
    const scheduled = todo
      .filter((x) => x.scheduledDate === date)
      .sort((a, b) => a.scheduledStart - b.scheduledStart);
    const unscheduled = todo.filter((x) => x.scheduledDate !== date);

    const blocks = [
      ...routines.map((r) => ({ ...r, kind: 'routine' })),
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
    const placeable = sortCandidates(unscheduled.filter(fits));
    const notFitting = unscheduled.filter((x) => !fits(x));
    const isEmpty = !routines.length && !todo.length;

    state = { date, routines, scheduled, unscheduled, blocks, windows, allTasks };

    root.innerHTML = `
      <div class="row between">
        <h2>${t('day.title')}</h2>
        <button id="auto-place" class="secondary">${t('day.autoPlace')}</button>
      </div>
      ${isEmpty ? `<p class="muted">${t('day.emptyHint')}</p>` : `<p class="muted">${t('day.dragHint')}</p>`}
      ${picker ? pickerHtml(picker, placeable) : ''}
      ${editTask ? editCardHtml(editTask, spheres) : ''}
      <div class="day-wrap">
        <div class="timeline" id="timeline">
          ${hoursHtml()}
          <div class="tl-now" style="top:${nowMinutes() * PX_PER_MIN}px"></div>
          ${blocks.map(blockHtml).join('')}
          ${windows.map(windowHtml).join('')}
        </div>
        <div class="side">
          <div class="grp-zones" title="${t('task.dropGroup')}">
            ${['Н', 'Ж', 'П'].map((g) => `<div class="grp-zone" data-g="${g}">${g} — ${t(`group.${g}`)}</div>`).join('')}
          </div>
          <h3>${t('day.tasks')}</h3>
          ${unscheduled.length
            ? [...placeable, ...notFitting].map((x) => taskRowHtml(x, fits(x))).join('')
            : `<p class="muted">${t('day.noTasks')}</p>`}
          <details class="done-box" ${done.length ? '' : ''}>
            <summary>${t('day.doneCount', { n: done.length })}</summary>
            ${done.length
              ? done.slice(0, 15).map((x) => `
                <button class="done-item" data-id="${x.id}" title="${t('task.return')}">
                  <span class="badge">${x.group}</span>${escapeHtml(x.title)}
                </button>`).join('')
              : `<p class="muted">${t('day.nothingDone')}</p>`}
          </details>
        </div>
      </div>`;
  }

  function hoursHtml() {
    let html = '';
    for (let h = 0; h <= 24; h++) {
      const label = h % 2 === 0 ? minutesToTime(h * 60) : '';
      html += `<div class="tl-hour" style="top:${h * 60 * PX_PER_MIN}px">${label}</div>`;
    }
    return html;
  }

  function taskRowHtml(task, canPlace) {
    const label = `
      <span class="badge">${task.group}</span>${escapeHtml(task.title)}
      <span class="muted">${task.durationMin} ${t('task.minutes')}${canPlace ? '' : ` — ${t('day.notFit')}`}</span>`;
    return `
      <div class="task-row${canPlace ? '' : ' dimmed'}">
        ${canPlace
          ? `<button class="side-task" data-id="${task.id}" title="${t('task.putFirst')}">${label}</button>`
          : `<span class="task-label">${label}</span>`}
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
          <label>${t('task.duration')} <input id="e-dur" type="number" min="5" step="5" value="${task.durationMin}"></label>
          <label>${t('common.group')}
            <select id="e-group">
              ${['Н', 'Ж', 'П'].map((g) =>
                `<option value="${g}"${g === task.group ? ' selected' : ''}>${g} — ${t(`group.${g}`)}</option>`).join('')}
            </select>
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
        <div class="row">
          <button id="e-save" data-id="${task.id}">${t('common.save')}</button>
          <button id="e-delete" data-id="${task.id}" class="danger">${t('task.deleteBtn')}</button>
        </div>
      </div>`;
  }

  function blockHtml(b) {
    const height = Math.max((b.end - b.start) * PX_PER_MIN, 16);
    const attrs = b.kind === 'task' ? ` data-id="${b.taskId}" title="${t('task.removeFromDay')}"` : '';
    const done = b.kind === 'task' ? ` <span class="tl-done" data-id="${b.taskId}" title="${t('task.markDone')}">✓</span>` : '';
    return `
      <div class="tl-block tl-${b.kind}"${attrs} style="top:${b.start * PX_PER_MIN}px;height:${height}px">
        ${minutesToTime(b.start)} ${escapeHtml(b.label)}${done}
      </div>`;
  }

  function windowHtml(w) {
    const height = Math.max((w.end - w.start) * PX_PER_MIN, 22);
    return `
      <div class="tl-window" style="top:${w.start * PX_PER_MIN}px;height:${height}px">
        <button class="win-add" data-start="${w.start}" data-end="${w.end}"
          title="${t('task.putInto', { a: minutesToTime(w.start), b: minutesToTime(w.end) })}">+</button>
      </div>`;
  }

  function pickerHtml(w, list) {
    const fitting = list.filter((x) => x.durationMin <= w.end - w.start);
    return `
      <div class="card">
        <div class="row between">
          <strong>${t('day.window')} ${minutesToTime(w.start)}–${minutesToTime(w.end)}</strong>
          <button id="picker-close" class="secondary">${t('common.close')}</button>
        </div>
        ${fitting.length
          ? fitting.map((x) => `
            <button class="pick-task" data-id="${x.id}" data-start="${w.start}">
              <span class="badge">${x.group}</span>${escapeHtml(x.title)} <span class="muted">${x.durationMin} ${t('task.minutes')}</span>
            </button>`).join('')
          : `<p class="muted">${t('picker.noFit')}</p>`}
      </div>`;
  }

  function nowMinutes() {
    const d = new Date();
    return d.getHours() * 60 + d.getMinutes();
  }

  // Занятость дня без указанного дела — для проверки мест при перетаскивании
  function occupancyExcept(taskId) {
    const { routines, scheduled } = state;
    return [
      ...routines,
      ...scheduled
        .filter((x) => x.id !== taskId)
        .map((x) => ({ start: x.scheduledStart, end: x.scheduledStart + x.durationMin, taskId: x.id })),
    ];
  }

  // Координата указателя -> минута таймлайна с шагом SNAP_MIN
  function pointerToMinutes(timeline, clientY, durationMin) {
    const rect = timeline.getBoundingClientRect();
    const raw = (clientY - rect.top) / PX_PER_MIN;
    const snapped = Math.round(raw / SNAP_MIN) * SNAP_MIN;
    return Math.max(0, Math.min(snapped, 24 * 60 - durationMin));
  }

  async function autoPlace() {
    const { date, routines, scheduled, unscheduled } = state;
    // уже поставленные дела тоже занимают время — учитываем их как занятость
    const occupancy = [
      ...routines,
      ...scheduled.map((x) => ({ start: x.scheduledStart, end: x.scheduledStart + x.durationMin, label: x.title })),
    ];
    const plan = buildDay(date, occupancy, unscheduled);
    for (const b of plan.blocks.filter((x) => x.kind === 'task')) {
      await updateTask(b.taskId, { scheduledDate: date, scheduledStart: b.start });
    }
    render();
  }

  // ---------- перетаскивание ----------
  // Клик без движения сохраняет старые действия: блок на таймлайне — убрать,
  // дело в колонке — в первое подходящее окно. Движение сверх порога — drag.

  root.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    const block = e.target.closest('.tl-task');
    const sideItem = e.target.closest('.side-task');
    const src = block || sideItem;
    if (!src || e.target.closest('.tl-done')) return;

    const task = (state?.allTasks || []).find((x) => x.id === src.dataset.id);
    if (!task) return;

    drag = { el: src, taskId: task.id, durationMin: task.durationMin, startX: e.clientX, startY: e.clientY, moved: false, ghost: null };
    try {
      src.setPointerCapture(e.pointerId);
    } catch {
      // без захвата pointermove всё равно всплывает до root
    }
  });

  root.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    if (!drag.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;

    if (!drag.moved) {
      drag.moved = true;
      const ghost = drag.el.cloneNode(true);
      ghost.className = `drag-ghost ${drag.el.className}`;
      ghost.style.width = `${drag.el.offsetWidth}px`;
      document.body.appendChild(ghost);
      drag.ghost = ghost;
      drag.el.classList.add('drag-src');
    }
    drag.ghost.style.left = `${e.clientX}px`;
    drag.ghost.style.top = `${e.clientY}px`;

    // сначала — зоны смены группы в колонке дел
    let overGroup = null;
    root.querySelectorAll('.grp-zone').forEach((zone) => {
      const r = zone.getBoundingClientRect();
      const over = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      zone.classList.toggle('drop-col', over);
      if (over) overGroup = zone.dataset.g;
    });
    drag.dropGroup = overGroup;

    const timeline = root.querySelector('#timeline');
    const inTimeline = !overGroup && timeline && e.clientX >= timeline.getBoundingClientRect().left;
    const minutes = inTimeline ? pointerToMinutes(timeline, e.clientY, drag.durationMin) : null;
    const ok = minutes != null && canPlaceAt(occupancyExcept(drag.taskId), minutes, drag.durationMin, drag.taskId);
    drag.dropAt = ok ? minutes : null;
    timeline?.classList.toggle('drop-ok', ok);
    timeline?.classList.toggle('drop-bad', minutes != null && !ok);
  });

  root.addEventListener('pointerup', async () => {
    if (!drag) return;
    const { taskId, moved, dropAt, dropGroup, ghost, el } = drag;
    const wasDrag = moved;
    ghost?.remove();
    el.classList.remove('drag-src');
    root.querySelectorAll('.grp-zone').forEach((z) => z.classList.remove('drop-col'));
    root.querySelector('#timeline')?.classList.remove('drop-ok', 'drop-bad');
    drag = null;

    if (!wasDrag) return; // обычный клик — обработает click-слушатель
    suppressClick();
    if (dropGroup) {
      await updateTask(taskId, { group: dropGroup });
    } else if (dropAt != null) {
      await updateTask(taskId, { scheduledDate: state.date, scheduledStart: dropAt });
    }
    render();
  });

  root.addEventListener('pointercancel', () => {
    if (!drag) return;
    drag.ghost?.remove();
    drag.el.classList.remove('drag-src');
    root.querySelectorAll('.grp-zone').forEach((z) => z.classList.remove('drop-col'));
    root.querySelector('#timeline')?.classList.remove('drop-ok', 'drop-bad');
    drag = null;
    suppressClick();
    render();
  });

  // после перетаскивания подавляем следующий клик (pointerup -> click)
  let skipClick = false;
  function suppressClick() {
    skipClick = true;
    setTimeout(() => { skipClick = false; }, 50);
  }

  root.addEventListener('click', async (e) => {
    if (skipClick) return;
    if (e.target.closest('#auto-place')) {
      await autoPlace();
      return;
    }
    if (e.target.closest('#picker-close')) {
      picker = null;
      render();
      return;
    }
    if (e.target.closest('#edit-close')) {
      editing = null;
      render();
      return;
    }

    if (e.target.id === 'e-save') {
      const x = state.allTasks.find((y) => y.id === e.target.dataset.id);
      const patch = {
        title: root.querySelector('#e-title').value.trim(),
        durationMin: Number(root.querySelector('#e-dur').value) || 30,
        group: root.querySelector('#e-group').value,
        sphereId: root.querySelector('#e-sphere').value || null,
        dueAt: localInputToTs(root.querySelector('#e-remind').value),
      };
      if (!patch.title) return;
      // при смене длительности место на таймлайне могло перестать подходить
      if (x.scheduledDate && patch.durationMin !== x.durationMin) {
        patch.scheduledDate = null;
        patch.scheduledStart = null;
      }
      await updateTask(x.id, patch);
      editing = null;
      render();
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
      picker = null;
      render();
      return;
    }

    const pick = e.target.closest('.pick-task');
    if (pick) {
      await updateTask(pick.dataset.id, { scheduledDate: state.date, scheduledStart: Number(pick.dataset.start) });
      picker = null;
      render();
      return;
    }

    const add = e.target.closest('.win-add');
    if (add) {
      picker = { start: Number(add.dataset.start), end: Number(add.dataset.end) };
      render();
      return;
    }

    const doneBtn = e.target.closest('.done-btn');
    if (doneBtn) {
      await updateTask(doneBtn.dataset.id, { status: 'done', scheduledDate: null, scheduledStart: null });
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
      const w = state.windows.find((x) => x.end - x.start >= task.durationMin);
      if (w) {
        await updateTask(task.id, { scheduledDate: state.date, scheduledStart: w.start });
        render();
      }
      return;
    }

    const tlDone = e.target.closest('.tl-done');
    if (tlDone) {
      await updateTask(tlDone.dataset.id, { status: 'done', scheduledDate: null, scheduledStart: null });
      render();
      return;
    }

    const taskBlock = e.target.closest('.tl-task');
    if (taskBlock && taskBlock.dataset.id) {
      await updateTask(taskBlock.dataset.id, { scheduledDate: null, scheduledStart: null });
      render();
    }
  });

  document.addEventListener('tab-shown', (e) => {
    if (e.detail === 'day') render();
  });

  render();
}
