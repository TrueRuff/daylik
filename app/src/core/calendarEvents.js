// события для FullCalendar: рутины и запланированные дела, разворачиваемые
// по датам диапазона (день на экране «День», месяц на экране «Календарь»).
// чистые функции без DOM — покрываются юнит-тестами.

import { practiceAppliesOn, addDays, weekdayOf } from './schedule.js';
import { practicesToBlocks } from './dayPlan.js';

// цвета как в дизайн-системе (styles.css): Н терракота, Ж янтарь, П синий
export const GROUP_COLORS = { 'Н': '#a94e35', 'Ж': '#8a6410', 'П': '#40628a' };
export const ROUTINE_COLOR = '#6f7581';

// date -> 'YYYY-MM-DD' в локальной зоне (без UTC-сдвига)
export function toDateStr(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function localDate(dateStr, minutes) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d, Math.floor(minutes / 60), minutes % 60);
}

// диапазон дат [from, to] включительно; рутины фильтруются по дню недели,
// полночные разбиваются practicesToBlocks; дела берутся с датой и временем.
// дела с датой без времени — события «весь день» (видны в месяце).
export function eventsForRange(fromDate, toDate, practices, tasks) {
  const events = [];
  for (let date = fromDate; date <= toDate; date = addDays(date, 1)) {
    const ofToday = practices.filter((p) => practiceAppliesOn(p, weekdayOf(date)));
    for (const b of practicesToBlocks(ofToday)) {
      events.push({
        id: `p:${b.id}:${date}:${b.start}`,
        title: b.label,
        start: localDate(date, b.start),
        end: localDate(date, b.end),
        backgroundColor: ROUTINE_COLOR,
        editable: false,
        extendedProps: { kind: 'routine', practiceId: b.id },
      });
    }
    for (const task of tasks) {
      if (task.scheduledDate !== date || task.scheduledStart == null) continue;
      events.push(taskEvent(task, date));
    }
  }
  return events;
}

export function taskEvent(task, date = task.scheduledDate) {
  const timed = task.scheduledStart != null;
  return {
    id: `t:${task.id}`,
    title: `${task.group} · ${task.title}`,
    start: timed ? localDate(date, task.scheduledStart) : localDate(date, 0),
    end: timed ? localDate(date, task.scheduledStart + task.durationMin) : null,
    allDay: !timed,
    backgroundColor: GROUP_COLORS[task.group] ?? ROUTINE_COLOR,
    editable: timed,
    extendedProps: { kind: 'task', taskId: task.id },
  };
}

// события «весь день» (дата без времени) в границах диапазона — для месяца
export function allDayEvents(fromDate, toDate, tasks) {
  return tasks
    .filter((x) => x.scheduledDate && x.scheduledStart == null
      && x.scheduledDate >= fromDate && x.scheduledDate <= toDate)
    .map((x) => taskEvent(x));
}
