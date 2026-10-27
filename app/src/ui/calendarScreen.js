// экран «Календарь»: месяц FullCalendar — все запланированные дела и рутины
// за месяц, пролистывание назад/вперёд. Просмотр: расстановка — на «Дне».

import { Calendar } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import ruLocale from '@fullcalendar/core/locales/ru';
import enLocale from '@fullcalendar/core/locales/en-gb';
import { getPractices, getTasks } from '../core/storage.js';
import { eventsForRange, allDayEvents, toDateStr } from '../core/calendarEvents.js';
import { getLang, onChange } from '../core/i18n.js';

export function initCalendarScreen(root) {
  let dirty = true; // данные меняются на других экранах — обновимся при показе
  let calendar = null;

  // локаль меняется только пересозданием календаря (смена языка EN/RU)
  function build() {
    calendar?.destroy();
    calendar = new Calendar(root, {
      plugins: [dayGridPlugin],
      initialView: 'dayGridMonth',
      locale: getLang() === 'en' ? enLocale : ruLocale,
      firstDay: 1,
      headerToolbar: { left: 'prev,next today', center: 'title', right: '' },
      height: 740,
      // диапазон, который просит календарь, — видимые дни (включая хвосты
      // соседних месяцев); рутины разворачиваются по каждому дню
      events: async (info, success) => {
        const from = toDateStr(info.start);
        const to = toDateStr(info.end);
        const practices = await getPractices();
        const todo = await getTasks({ status: 'todo' });
        const timed = eventsForRange(from, to, practices, todo);
        success([...timed, ...allDayEvents(from, to, todo)]);
      },
    });
    calendar.render();
  }

  build();
  onChange(build);

  document.addEventListener('tab-shown', (e) => {
    if (e.detail === 'day' || e.detail === 'input' || e.detail === 'spheres') dirty = true;
    if (e.detail === 'calendar' && dirty) {
      dirty = false;
      calendar.refetchEvents();
    }
  });
}
