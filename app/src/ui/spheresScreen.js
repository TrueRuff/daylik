// Экран «Сферы»: три группы Н/Ж/П, карточка сферы с описаниями и практиками

import { Sphere, Practice, GROUP_TITLES } from '../core/models.js';
import {
  getAllSpheres, saveSphere, deleteSphere,
  getPractices, savePractice, deletePractice,
} from '../core/storage.js';
import { DAY_NAMES, minutesToTime, timeToMinutes, formatDays } from '../core/schedule.js';
import { escapeHtml } from './dom.js';

export function initSpheresScreen(root) {
  async function renderList() {
    const spheres = await getAllSpheres();
    root.innerHTML = `
      <h2>Сферы</h2>
      <p class="muted">Сфера — направление жизни, а не разовая задача: у неё краткое и полное описание, к ней крепятся регулярные практики и дела.</p>
      <div class="sphere-cols">
        ${['Н', 'Ж', 'П'].map((g) => {
          const list = spheres.filter((s) => s.group === g);
          return `
            <div class="sphere-col">
              <h3>${g} — ${GROUP_TITLES[g]}</h3>
              ${list.length
                ? list.map((s) => `<button class="sphere-item" data-id="${s.id}">${escapeHtml(s.name)}</button>`).join('')
                : '<p class="muted">пусто</p>'}
            </div>`;
        }).join('')}
      </div>
      <p><button id="new-sphere" class="secondary">Новая сфера</button></p>
      <div id="detail"></div>`;
  }

  function formHtml(sphere, practices, isNew) {
    return `
      <div class="card">
        <h3>${isNew ? 'Новая сфера' : escapeHtml(sphere.name)}</h3>
        <label>Название <input id="s-name" value="${escapeHtml(sphere.name)}"></label>
        <label>Группа
          <select id="s-group">
            ${['Н', 'Ж', 'П'].map((g) =>
              `<option value="${g}"${g === sphere.group ? ' selected' : ''}>${g} — ${GROUP_TITLES[g]}</option>`).join('')}
          </select>
        </label>
        <label>Кратко (перечитывать каждый день)
          <textarea id="s-brief" rows="2">${escapeHtml(sphere.brief)}</textarea>
        </label>
        <label>Полностью (методы, рутина)
          <textarea id="s-details" rows="4">${escapeHtml(sphere.details)}</textarea>
        </label>
        <div class="row">
          <button id="save-sphere" data-id="${sphere.id}">Сохранить</button>
          ${isNew ? '' : `<button id="del-sphere" data-id="${sphere.id}" class="danger">Удалить сферу</button>`}
        </div>

        ${isNew ? '' : `
        <h4>Практики</h4>
        ${practices.length ? practices.map((p) => `
          <div class="practice-row">
            <span>${escapeHtml(p.title)} — ${minutesToTime(p.start)}–${minutesToTime(p.end)}, ${formatDays(p.days)}</span>
            <button class="del-practice" data-id="${p.id}" title="Удалить">×</button>
          </div>`).join('') : '<p class="muted">практик пока нет</p>'}
        <label>Новая практика <input id="p-title" placeholder="например: тренировка"></label>
        <div class="row">
          <label>Начало <input id="p-start" type="time" value="09:00"></label>
          <label>Конец <input id="p-end" type="time" value="10:00"></label>
        </div>
        <div class="days">
          ${DAY_NAMES.map((d, i) => `<label class="day"><input type="checkbox" data-day="${i + 1}" checked>${d}</label>`).join('')}
        </div>
        <p><button id="add-practice" data-id="${sphere.id}" class="secondary">Добавить практику</button></p>`}
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

  root.addEventListener('click', async (e) => {
    const item = e.target.closest('.sphere-item');
    if (item) {
      await openDetail(item.dataset.id);
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

  document.addEventListener('tab-shown', (e) => {
    if (e.detail === 'spheres') renderList();
  });

  renderList();
}
