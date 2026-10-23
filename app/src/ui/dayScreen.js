// Экран «День»: таймлайн 00:00–24:00 — рутины, поставленные дела, свободные окна

import { getPractices, getTasks, updateTask, deleteTask, getAllSpheres } from '../core/storage.js';
import { practiceAppliesOn, minutesToTime, tsToLocalInput, localInputToTs } from '../core/schedule.js';
import { buildDay, computeFreeWindows, sortCandidates } from '../core/dayPlan.js';
import { GROUP_TITLES } from '../core/models.js';
import { escapeHtml } from './dom.js';

const PX_PER_MIN = 0.8;

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

  async function render() {
    const date = todayStr();
    const practices = (await getPractices()).filter((p) => practiceAppliesOn(p, todayWeekday()));
    const routines = practices.map((p) => ({ start: p.start, end: p.end, label: p.title }));

    const todo = await getTasks({ status: 'todo' });
    const done = (await getTasks({ status: 'done' })).sort((a, b) => b.createdAt - a.createdAt);
    const spheres = await getAllSpheres();
    const allTasks = [...todo, ...done];
    const editTask = editing ? allTasks.find((t) => t.id === editing) : null;
    if (editing && !editTask) editing = null;
    const scheduled = todo
      .filter((t) => t.scheduledDate === date)
      .sort((a, b) => a.scheduledStart - b.scheduledStart);
    const unscheduled = todo.filter((t) => t.scheduledDate !== date);

    const blocks = [
      ...routines.map((r) => ({ ...r, kind: 'routine' })),
      ...scheduled.map((t) => ({
        start: t.scheduledStart,
        end: t.scheduledStart + t.durationMin,
        kind: 'task',
        label: t.title,
        taskId: t.id,
      })),
    ].sort((a, b) => a.start - b.start);

    const windows = computeFreeWindows(blocks);
    const fits = (t) => windows.some((w) => w.end - w.start >= t.durationMin);
    const placeable = sortCandidates(unscheduled.filter(fits));
    const postponed = unscheduled.filter((t) => !fits(t));

    state = { date, routines, scheduled, unscheduled, windows, allTasks };

    root.innerHTML = `
      <div class="row between">
        <h2>Сегодня</h2>
        <button id="auto-place" class="secondary">Разложить автоматически</button>
      </div>
      ${picker ? pickerHtml(picker, placeable) : ''}
      ${editTask ? editCardHtml(editTask, spheres) : ''}
      <div class="day-wrap">
        <div class="timeline">
          ${hoursHtml()}
          <div class="tl-now" style="top:${nowMinutes() * PX_PER_MIN}px"></div>
          ${blocks.map(blockHtml).join('')}
          ${windows.map(windowHtml).join('')}
        </div>
        <div class="side">
          <h3>Дела</h3>
          ${placeable.length
            ? placeable.map((t) => taskRowHtml(t, true)).join('')
            : '<p class="muted">нет свободных дел</p>'}
          <h3>На потом</h3>
          ${postponed.length
            ? postponed.map((t) => taskRowHtml(t, false)).join('')
            : '<p class="muted">всё помещается</p>'}
          <h3>Сделано</h3>
          ${done.length
            ? done.slice(0, 10).map((t) => `
              <button class="done-item" data-id="${t.id}" title="Вернуть в дела">
                <span class="badge">${t.group}</span>${escapeHtml(t.title)}
              </button>`).join('')
            : '<p class="muted">пока ничего</p>'}
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

  function taskRowHtml(t, placeable) {
    const label = `
      <span class="badge">${t.group}</span>${escapeHtml(t.title)} <span class="muted">${t.durationMin} мин</span>`;
    return `
      <div class="task-row">
        ${placeable
          ? `<button class="side-task" data-id="${t.id}" title="Поставить в первое подходящее окно">${label}</button>`
          : `<span class="task-label">${label}</span>`}
        <button class="edit-btn" data-id="${t.id}" title="Редактировать">✎</button>
        <button class="done-btn" data-id="${t.id}" title="Отметить сделанным">✓</button>
      </div>`;
  }

  function editCardHtml(t, spheres) {
    return `
      <div class="card">
        <div class="row between">
          <strong>Редактирование дела</strong>
          <button id="edit-close" class="secondary">Закрыть</button>
        </div>
        <label>Название <input id="e-title" value="${escapeHtml(t.title)}"></label>
        <div class="row">
          <label>Длительность, мин <input id="e-dur" type="number" min="5" step="5" value="${t.durationMin}"></label>
          <label>Группа
            <select id="e-group">
              ${['Н', 'Ж', 'П'].map((g) =>
                `<option value="${g}"${g === t.group ? ' selected' : ''}>${g} — ${GROUP_TITLES[g]}</option>`).join('')}
            </select>
          </label>
        </div>
        <label>Сфера
          <select id="e-sphere">
            <option value="">без сферы</option>
            ${spheres.map((s) =>
              `<option value="${s.id}"${s.id === t.sphereId ? ' selected' : ''}>${escapeHtml(s.name)}</option>`).join('')}
          </select>
        </label>
        <label>Напомнить <input id="e-remind" type="datetime-local" value="${tsToLocalInput(t.dueAt)}"></label>
        <div class="row">
          <button id="e-save" data-id="${t.id}">Сохранить</button>
          <button id="e-delete" data-id="${t.id}" class="danger">Удалить дело</button>
        </div>
      </div>`;
  }

  function blockHtml(b) {
    const height = Math.max((b.end - b.start) * PX_PER_MIN, 16);
    const attrs = b.kind === 'task' ? ` data-id="${b.taskId}" title="Клик — убрать из дня"` : '';
    const done = b.kind === 'task' ? ` <span class="tl-done" data-id="${b.taskId}" title="Сделано">✓</span>` : '';
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
          title="Положить дело в окно ${minutesToTime(w.start)}–${minutesToTime(w.end)}">+</button>
      </div>`;
  }

  function pickerHtml(w, list) {
    const fitting = list.filter((t) => t.durationMin <= w.end - w.start);
    return `
      <div class="card">
        <div class="row between">
          <strong>Окно ${minutesToTime(w.start)}–${minutesToTime(w.end)}</strong>
          <button id="picker-close" class="secondary">Закрыть</button>
        </div>
        ${fitting.length
          ? fitting.map((t) => `
            <button class="pick-task" data-id="${t.id}" data-start="${w.start}">
              <span class="badge">${t.group}</span>${escapeHtml(t.title)} <span class="muted">${t.durationMin} мин</span>
            </button>`).join('')
          : '<p class="muted">Подходящих дел нет — все длиннее окна.</p>'}
      </div>`;
  }

  function nowMinutes() {
    const d = new Date();
    return d.getHours() * 60 + d.getMinutes();
  }

  async function autoPlace() {
    const { date, routines, scheduled, unscheduled } = state;
    // уже поставленные дела тоже занимают время — учитываем их как занятость
    const occupancy = [
      ...routines,
      ...scheduled.map((t) => ({ start: t.scheduledStart, end: t.scheduledStart + t.durationMin, label: t.title })),
    ];
    const plan = buildDay(date, occupancy, unscheduled);
    for (const b of plan.blocks.filter((b) => b.kind === 'task')) {
      await updateTask(b.taskId, { scheduledDate: date, scheduledStart: b.start });
    }
    render();
  }

  root.addEventListener('click', async (e) => {
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
      const t = state.allTasks.find((x) => x.id === e.target.dataset.id);
      const patch = {
        title: root.querySelector('#e-title').value.trim(),
        durationMin: Number(root.querySelector('#e-dur').value) || 30,
        group: root.querySelector('#e-group').value,
        sphereId: root.querySelector('#e-sphere').value || null,
        dueAt: localInputToTs(root.querySelector('#e-remind').value),
      };
      if (!patch.title) return;
      // при смене длительности место на таймлайне могло перестать подходить
      if (t.scheduledDate && patch.durationMin !== t.durationMin) {
        patch.scheduledDate = null;
        patch.scheduledStart = null;
      }
      await updateTask(t.id, patch);
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
      const task = state.unscheduled.find((t) => t.id === side.dataset.id);
      if (!task) return;
      const w = state.windows.find((w) => w.end - w.start >= task.durationMin);
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
