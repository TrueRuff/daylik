import { describe, it, expect } from 'vitest';
import { toIcs } from '../src/core/ics.js';
import { Task } from '../src/core/models.js';

const task = (id, over = {}) =>
  new Task({ id, title: `Дело ${id}`, group: 'Н', durationMin: 90, ...over });

describe('toIcs', () => {
  it('запланированное дело становится событием с началом, концом и сводкой', () => {
    const ics = toIcs([task('t1', { scheduledDate: '2026-10-24', scheduledStart: 600 })], { stamp: '20261024T080000' });
    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('BEGIN:VEVENT');
    expect(ics).toContain('UID:t1@daylik');
    expect(ics).toContain('DTSTART:20261024T100000'); // 600 мин = 10:00
    expect(ics).toContain('DTEND:20261024T113000');   // +90 минут
    expect(ics).toContain('SUMMARY:Дело t1');
    expect(ics.trimEnd().endsWith('END:VCALENDAR')).toBe(true);
  });

  it('дело без даты пропускается', () => {
    const ics = toIcs([task('t1'), task('t2', { scheduledDate: '2026-10-25', scheduledStart: 0 })]);
    expect(ics).not.toContain('UID:t1@daylik');
    expect(ics).toContain('UID:t2@daylik');
    expect(ics).toContain('DTSTART:20261025T000000');
  });

  it('спецсимволы экранируются, строки через CRLF', () => {
    const ics = toIcs([task('t1', { scheduledDate: '2026-10-24', scheduledStart: 0, title: 'Встреча; с, коллегами' })]);
    expect(ics).toContain('SUMMARY:Встреча\\; с\\, коллегами');
    expect(ics).toContain('\r\n');
  });

  it('пустой список — только каркас календаря', () => {
    const ics = toIcs([]);
    expect(ics).not.toContain('VEVENT');
    expect(ics).toContain('PRODID:-//Daylik//Planner//RU');
  });
});
