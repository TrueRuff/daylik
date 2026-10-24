// Экран «Направления»: три группы Н/Ж/П, карточка направления с описаниями
// и практиками. Карточку можно перетащить в другую колонку — смена группы.

import { Sphere, Practice } from '../core/models.js';
import {
  getAllSpheres, saveSphere, deleteSphere,
  getPractices, savePractice, deletePractice,
  exportAll, importAll,
} from '../core/storage.js';
import { serializeJson, serializeBinary, parseJson, parseBinary, normalizeImport } from '../core/serialization.js';
import { toIcs } from '../core/ics.js';
import { dayNames, minutesToTime, timeToMinutes, formatDays } from '../core/schedule.js';
import { t } from '../core/i18n.js';
import { escapeHtml, downloadFile, daysCheckboxes } from './dom.js';

const EXAMPLES = [
  { name: 'Сон', group: 'Н' },
  { name: 'Дом', group: 'Н' },
  { name: 'Отдых', group: 'Ж' },
  { name: 'Учёба', group: 'П' },
];

const DRAG_THRESHOLD = 6;

export function initSpheresScreen(root) {
  let drag = null; // перетаскивание карточки между колонками

  async function renderList() {
    const spheres = await getAllSpheres();
    const freePractices = (await getPractices()).filter((p) => !p.sphereId);
    root.innerHTML = `
      <h2>${t('spheres.title')}</h2>
      <p class="muted">${t('spheres.intro')}</p>
      <p class="muted legend">${t('spheres.legend')}</p>
      <div class="sphere-cols">
        ${['Н', 'Ж', 'П'].map((g) => {
          const list = spheres.filter((s) => s.group === g);
          return `
            <div class="sphere-col" data-g="${g}">
              <h3>${g} — ${t(`group.${g}`)}</h3>
              ${list.length
                ? list.map((s) => `<button class="sphere-item" data-id="${s.id}" title="${t('spheres.dragHint')}">${escapeHtml(s.name)}</button>`).join('')
                : `<p class="muted">${t('spheres.empty')}</p>`}
            </div>`;
        }).join('')}
      </div>
      ${!spheres.length ? `
      <p class="muted">${t('spheres.examples')}
        ${EXAMPLES.map((x) => `<button class="grp example" data-name="${x.name}" data-g="${x.group}">${x.name} · ${x.group}</button>`).join('')}
      </p>` : ''}
      <p><button id="new-sphere" class="secondary">${t('spheres.new')}</button></p>
      <div id="detail"></div>
      ${freePractices.length ? `
      <h3>${t('spheres.freePractices')}</h3>
      ${freePractices.map((p) => `
        <div class="practice-row">
          <span>${escapeHtml(p.title)} — ${minutesToTime(p.start)}–${minutesToTime(p.end)}, ${formatDays(p.days)}</span>
          <button class="del-free-practice" data-id="${p.id}" title="${t('common.delete')}">×</button>
        </div>`).join('')}` : ''}
      <h3>${t('data.title')}</h3>
      <div class="row">
        <button id="export-json" class="secondary">${t('data.exportJson')}</button>
        <button id="export-bin" class="secondary">${t('data.exportBin')}</button>
        <button id="export-ics" class="secondary">${t('data.exportIcs')}</button>
        <button id="import-data" class="secondary">${t('data.import')}</button>
        <input id="import-file" type="file" accept=".json,.daylik" hidden>
      </div>
      <p id="io-msg" class="muted"></p>`;
  }

  function formHtml(sphere, practices, isNew) {
    return `
      <div class="card">
        <h3>${isNew ? t('spheres.new') : escapeHtml(sphere.name)}</h3>
        <label>${t('common.title')} <input id="s-name" value="${escapeHtml(sphere.name)}"></label>
        <label>${t('common.group')}
          <select id="s-group">
            ${['Н', 'Ж', 'П'].map((g) =>
              `<option value="${g}"${g === sphere.group ? ' selected' : ''}>${g} — ${t(`group.${g}`)}</option>`).join('')}
          </select>
        </label>
        <label>${t('spheres.briefLabel')}
          <textarea id="s-brief" rows="2">${escapeHtml(sphere.brief)}</textarea>
        </label>
        <label>${t('spheres.detailsLabel')}
          <textarea id="s-details" rows="4">${escapeHtml(sphere.details)}</textarea>
        </label>
        <div class="row">
          <button id="save-sphere" data-id="${sphere.id}">${t('common.save')}</button>
          ${isNew ? '' : `<button id="del-sphere" data-id="${sphere.id}" class="danger">${t('spheres.deleteBtn')}</button>`}
        </div>

        ${isNew ? '' : `
        <h4>${t('spheres.practices')}</h4>
        ${practices.length ? practices.map((p) => `
          <div class="practice-row">
            <span>${escapeHtml(p.title)} — ${minutesToTime(p.start)}–${minutesToTime(p.end)}, ${formatDays(p.days)}</span>
            <button class="del-practice" data-id="${p.id}" title="${t('common.delete')}">×</button>
          </div>`).join('') : `<p class="muted">${t('spheres.noPractices')}</p>`}
        <label>${t('spheres.newPractice')} <input id="p-title" placeholder="${t('input.placeholder')}"></label>
        <div class="row">
          <label>${t('common.start')} <input id="p-start" type="time" value="09:00"></label>
          <label>${t('common.end')} <input id="p-end" type="time" value="10:00"></label>
        </div>
        <div class="days">${daysCheckboxes()}</div>
        <p><button id="add-practice" data-id="${sphere.id}" class="secondary">${t('spheres.addPractice')}</button></p>`}
      </div>`;
  }

  async function openDetail(id) {
    const detail = root.querySelector('#detail');
    if (!detail) return;

    if (!id) {
      detail.innerHTML = formHtml(new Sphere({ id: '', name: '', group: 'П' }), [], true);
      return;
    }
    const spheres = await getAllSpheres();
    const sphere = spheres.find((s) => s.id === id);
    if (!sphere) return;
    const practices = (await getPractices()).filter((p) => p.sphereId === id);
    detail.innerHTML = formHtml(sphere, practices, false);
    detail.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function ioMessage(text) {
    const el = root.querySelector('#io-msg');
    if (el) el.textContent = text;
  }

  async function exportBackup(binary) {
    const data = await exportAll();
    const date = new Date().toISOString().slice(0, 10);
    if (binary) {
      downloadFile(`daylik-${date}.daylik`, new Blob([serializeBinary(data)]));
    } else {
      downloadFile(`daylik-${date}.json`, new Blob([serializeJson(data)], { type: 'application/json' }));
    }
    ioMessage(t('data.saved'));
  }

  async function exportCalendar() {
    const tasks = (await getTasks()).filter((x) => x.scheduledDate);
    downloadFile('daylik.ics', new Blob([toIcs(tasks)], { type: 'text/calendar' }));
    ioMessage(t('data.saved'));
  }

  // Файл читаем всегда как байты и различаем по сигнатуре DAYL
  async function importFile(file) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const isBinary = bytes.length >= 4 && [68, 65, 89, 76].every((b, i) => bytes[i] === b);
    const data = isBinary
      ? parseBinary(bytes.buffer)
      : parseJson(new TextDecoder().decode(bytes));
    if (!data) {
      ioMessage(t('data.unreadable'));
      return;
    }

    const clean = normalizeImport(data);
    const ok = confirm(t('data.confirm', {
      s: clean.spheres.length,
      t: clean.tasks.length,
      p: clean.practices.length,
    }));
    if (!ok) return;

    await importAll(data);
    await renderList();
    document.dispatchEvent(new CustomEvent('tab-shown', { detail: 'day' }));
    ioMessage(t('data.imported'));
  }

  // ---------- перетаскивание карточки направления между колонками ----------

  root.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    const item = e.target.closest('.sphere-item');
    if (!item) return;
    drag = { el: item, id: item.dataset.id, startX: e.clientX, startY: e.clientY, moved: false, ghost: null, dropG: null };
    try {
      item.setPointerCapture(e.pointerId);
    } catch {
      // без захвата pointermove всплывает до root
    }
  });

  root.addEventListener('pointermove', (e) => {
    if (!drag) return;
    if (!drag.moved && Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY) < DRAG_THRESHOLD) return;
    if (!drag.moved) {
      drag.moved = true;
      const ghost = drag.el.cloneNode(true);
      ghost.className = 'drag-ghost';
      document.body.appendChild(ghost);
      drag.ghost = ghost;
      drag.el.classList.add('drag-src');
    }
    drag.ghost.style.left = `${e.clientX}px`;
    drag.ghost.style.top = `${e.clientY}px`;

    // колонка под курсором — цель для смены группы
    drag.dropG = null;
    root.querySelectorAll('.sphere-col').forEach((col) => {
      const r = col.getBoundingClientRect();
      const over = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      col.classList.toggle('drop-col', over);
      if (over) drag.dropG = col.dataset.g;
    });
  });

  let skipClick = false;

  async function finishDrag(cancelled) {
    if (!drag) return;
    const { moved, id, dropG, ghost, el } = drag;
    ghost?.remove();
    el.classList.remove('drag-src');
    root.querySelectorAll('.sphere-col').forEach((col) => col.classList.remove('drop-col'));
    drag = null;
    if (!moved || cancelled) return;
    skipClick = true;
    setTimeout(() => { skipClick = false; }, 50);
    if (dropG) {
      const spheres = await getAllSpheres();
      const sphere = spheres.find((s) => s.id === id);
      if (sphere && sphere.group !== dropG) {
        sphere.group = dropG;
        await saveSphere(sphere);
      }
    }
    await renderList();
  }

  root.addEventListener('pointerup', () => finishDrag(false));
  root.addEventListener('pointercancel', () => finishDrag(true));

  root.addEventListener('click', async (e) => {
    if (skipClick) return;
    const item = e.target.closest('.sphere-item');
    if (item) {
      await openDetail(item.dataset.id);
      return;
    }

    const example = e.target.closest('.example');
    if (example) {
      await saveSphere(new Sphere({ id: crypto.randomUUID(), name: example.dataset.name, group: example.dataset.g }));
      await renderList();
      return;
    }

    if (e.target.id === 'new-sphere') {
      await openDetail(null);
      root.querySelector('#s-name').focus();
      return;
    }

    if (e.target.id === 'save-sphere') {
      const name = root.querySelector('#s-name').value.trim();
      if (!name) return;
      const id = e.target.dataset.id || crypto.randomUUID();
      await saveSphere(new Sphere({
        id,
        name,
        group: root.querySelector('#s-group').value,
        brief: root.querySelector('#s-brief').value.trim(),
        details: root.querySelector('#s-details').value.trim(),
      }));
      await renderList();
      await openDetail(id);
      return;
    }

    if (e.target.id === 'del-sphere') {
      await deleteSphere(e.target.dataset.id);
      await renderList();
      return;
    }

    if (e.target.classList.contains('del-practice')) {
      await deletePractice(e.target.dataset.id);
      const addBtn = root.querySelector('#add-practice');
      if (addBtn) await openDetail(addBtn.dataset.id);
      return;
    }

    if (e.target.classList.contains('del-free-practice')) {
      await deletePractice(e.target.dataset.id);
      await renderList();
      return;
    }

    if (e.target.id === 'export-json') {
      await exportBackup(false);
      return;
    }
    if (e.target.id === 'export-bin') {
      await exportBackup(true);
      return;
    }
    if (e.target.id === 'export-ics') {
      await exportCalendar();
      return;
    }
    if (e.target.id === 'import-data') {
      root.querySelector('#import-file').click();
      return;
    }

    if (e.target.id === 'add-practice') {
      const title = root.querySelector('#p-title').value.trim();
      const days = [...root.querySelectorAll('.days input:checked')].map((c) => Number(c.dataset.day));
      if (!title || !days.length) return;
      const practice = new Practice({
        id: crypto.randomUUID(),
        sphereId: e.target.dataset.id,
        title,
        start: timeToMinutes(root.querySelector('#p-start').value || '09:00'),
        end: timeToMinutes(root.querySelector('#p-end').value || '10:00'),
        days,
      });
      await savePractice(practice);
      await openDetail(practice.sphereId);
    }
  });

  root.addEventListener('change', (e) => {
    if (e.target.id === 'import-file' && e.target.files.length) {
      importFile(e.target.files[0]);
      e.target.value = ''; // тот же файл можно выбрать повторно
    }
  });

  document.addEventListener('tab-shown', (e) => {
    if (e.detail === 'spheres') renderList();
  });

  renderList();
}
