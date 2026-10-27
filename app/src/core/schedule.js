// вспомогательные функции для расписания: время и дни недели

import { t } from './i18n.js';

// названия дней — из словаря локализации (см. i18n.js), ключи 0..6
export function dayNames() {
  return t('dayNames');
}

export function timeToMinutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

export function minutesToTime(min) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// проходит ли практика в указанный день недели (1..7, 1 = понедельник)
export function practiceAppliesOn(practice, dayOfWeek) {
  return practice.days.includes(dayOfWeek);
}

export function formatDays(days) {
  if (days.length === 7) return t('schedule.daily');
  const names = t('dayNames');
  return days
    .slice()
    .sort((a, b) => a - b)
    .map((d) => names[d - 1])
    .join(', ');
}

// timestamp -> значение поля datetime-local ('YYYY-MM-DDTHH:mm', локальное время)
export function tsToLocalInput(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// значение datetime-local -> timestamp; пустая строка -> null
export function localInputToTs(val) {
  return val ? new Date(val).getTime() : null;
}

// сегодняшняя дата 'YYYY-MM-DD' в локальном времени
export function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// 'YYYY-MM-DD' + n дней -> 'YYYY-MM-DD' (локально, без таймзонных сдвигов)
export function addDays(dateStr, n) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d + n);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
}

// день недели даты 'YYYY-MM-DD': 1 = понедельник .. 7 = воскресенье
export function weekdayOf(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return ((new Date(y, m - 1, d).getDay() + 6) % 7) + 1;
}
