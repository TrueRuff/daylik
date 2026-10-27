// экран «Календарь»: месяц FullCalendar. События рисуются точками
// загруженности (цвет группы), клик по дню откажет модалку со списком
// рутин и дел этого дня. Расстановка — на «Дне».

import { Calendar } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import ruLocale from '@fullcalendar/core/locales/ru';
import enLocale from '@fullcalendar/core/locales/en-gb';
import { getPractices, getTasks } from '../core/storage.js';
import { eventsForRange, allDayEvents, toDateStr } from '../core/calendarEvents.js';
import { practiceAppliesOn, weekdayOf, minutesToTime } from '../core/schedule.js';
import { getLang, t, onChange } from '../core/i18n.js';
import { escapeHtml } from './dom.js';

export function initCalendarScreen(root) {
  let dirty = true; // данные меняются на других экранах — обновимся при показе
  let calendar = null;
  let cache = { practices: [], tasks: [] }; // данные видимого диапазона

  // модалка дня живёт рядом с календарём (календарь перерисовывает root)
  const mount = document.createElement('div');
  const modal = document.createElement('div');
  modal.id = 'cal-modal';
  root.appendChild(mount);
  root.appendChild(modal);

  function dayLabel(dateStr) {
    return new Date(`${dateStr}T00:00`).toLocaleDateString(
      getLang() === 'en' ? 'en-GB' : 'ru-RU',
      { weekday: 'long', day: 'numeric', month: 'long' });
  }

  function dayModalHtml(dateStr) {
    const wd = weekdayOf(dateStr);
    const routines = cache.practices
      .filter((p) => practiceAppliesOn(p, wd))
      .sort((a, b) => a.start - b.start);
    const tasks = cache.tasks
      .filter((x) => x.scheduledDate === dateStr)
      .sort((a, b) => (a.scheduledStart ?? -1) - (b.scheduledStart ?? -1));
    const rows = [
      ...routines.map((p) => `
        <div class="tl-row">
          <div class="tl-t">${minutesToTime(p.start)}</div>
          <div class="tl-card routine"><span class="tl-title">↻ ${escapeHtml(p.title)}</span></div>
        </div>`),
      ...tasks.map((x) => `
        <div class="tl-row">
          <div class="tl-t">${x.scheduledStart != null ? minutesToTime(x.scheduledStart) : '—'}</div>
          <div class="tl-card task" style="background:var(--accent)">
            <span class="tl-title">${escapeHtml(x.title)}</span>
            ${x.durationMin ? `<span class="tl-dur">${x.durationMin} ${t('task.minutes')}</span>` : ''}
          </div>
        </div>`),
    ];
    return `
      <div class="modal-overlay">
        <div class="modal-card">
          <div class="row between modal-head">
            <strong>${dayLabel(dateStr)}</strong>
            <button id="cal-modal-close" class="icon-btn" title="${t('common.close')}">✕</button>
          </div>
          ${rows.length ? `<div class="tl-list">${rows.join('')}</div>` : `<p class="muted">${t('cal.empty')}</p>`}
        </div>
      </div>`;
  }

  root.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay') || e.target.closest('#cal-modal-close')) {
      modal.innerHTML = '';
      return;
    }
    const day = e.target.closest('.fc-daygrid-day');
    if (day?.dataset.date) modal.innerHTML = dayModalHtml(day.dataset.date);
  });

  function build() {
    calendar?.destroy();
    calendar = new Calendar(mount, {
      plugins: [dayGridPlugin],
      initialView: 'dayGridMonth',
      locale: getLang() === 'en' ? enLocale : ruLocale,
      firstDay: 1,
      headerToolbar: { left: 'prev,next today', center: 'title', right: '' },
      height: 740,
      dayMaxEvents: 4,
      moreLinkClick: 'popover',
      // точки вместо чипов: событие сжимается в кружок цвета группы
      eventContent: (arg) => ({
        html: `<span class="cal-dot" style="background:${arg.event.backgroundColor || 'var(--ink-soft)'}" title="${escapeHtml(arg.event.title)}"></span>`,
      }),
      // диапазон, который просит календарь, — видимые дни (включая хвосты
      // соседних месяцев); рутины разворачиваются по каждому дню
      events: async (info, success) => {
        const from = toDateStr(info.start);
        const to = toDateStr(info.end);
        const practices = await getPractices();
        const todo = await getTasks({ status: 'todo' });
        cache = { practices, tasks: todo };
        success([...eventsForRange(from, to, practices, todo), ...allDayEvents(from, to, todo)]);
      },
    });
    calendar.render();
  }

  build();
  onChange(build);

  document.addEventListener('tab-shown', (e) => {
    if (e.detail === 'day' || e.detail === 'spheres') dirty = true;
    if (e.detail === 'calendar' && dirty) {
      dirty = false;
      calendar.refetchEvents();
    }
  });
}
