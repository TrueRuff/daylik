// Экспорт дел в формат календаря iCalendar (.ics): запланированные дела
// становятся событиями с началом и длительностью. RFC 5545: строки через CRLF,
// спецсимволы экранируются, даты в базовом формате YYYYMMDDTHHMMSS.

import { minutesToTime } from './schedule.js';

function icsDate(dateStr, minutes) {
  const [y, m, d] = dateStr.split('-');
  const hh = String(Math.floor(minutes / 60)).padStart(2, '0');
  const mm = String(minutes % 60).padStart(2, '0');
  return `${y}${m}${d}T${hh}${mm}00`;
}

function esc(s) {
  return String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

// folding: строки длиннее 75 октетов продолжаются с пробела
function fold(line) {
  if (line.length <= 73) return line;
  const parts = [line.slice(0, 73)];
  let rest = line.slice(73);
  while (rest.length > 72) {
    parts.push(rest.slice(0, 72));
    rest = rest.slice(72);
  }
  if (rest) parts.push(rest);
  return parts.join('\r\n ');
}

/**
 * @param {Array<Task>} tasks дела с scheduledDate (другие пропускаются)
 * @param {Object} [opts] { stamp: строка DTSTAMP 'YYYYMMDDTHHMMSS' }
 */
export function toIcs(tasks, opts = {}) {
  const stamp = opts.stamp || icsDate('2026-01-01', 0);
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Daylik//Planner//RU',
    'CALSCALE:GREGORIAN',
  ];
  for (const t of tasks) {
    if (!t.scheduledDate) continue;
    lines.push(
      'BEGIN:VEVENT',
      `UID:${t.id}@daylik`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${icsDate(t.scheduledDate, t.scheduledStart || 0)}`,
      `DTEND:${icsDate(t.scheduledDate, (t.scheduledStart || 0) + t.durationMin)}`,
      fold(`SUMMARY:${esc(t.title)}`),
      `DESCRIPTION:${esc(`Дейлик · группа ${t.group}`)}`,
      'END:VEVENT',
    );
  }
  lines.push('END:VCALENDAR');
  return lines.join('\r\n') + '\r\n';
}
