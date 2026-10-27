// Экранирование пользовательского текста перед вставкой в разметку
export function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

// Скачивание файла через временный <a download>
export function downloadFile(name, blob) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}

// Чекбоксы дней недели (1..7); общий фрагмент для ввода, направлений и блоков дня
import { dayNames, minutesToTime } from '../core/schedule.js';
import { t } from '../core/i18n.js';

export function daysCheckboxes(selected = [1, 2, 3, 4, 5, 6, 7]) {
  return dayNames().map((d, i) =>
    `<label class="day"><input type="checkbox" data-day="${i + 1}"${selected.includes(i + 1) ? ' checked' : ''}>${d}</label>`
  ).join('');
}

// Опции селекта групп Н/Ж/П с выделенной текущей
export function groupOptions(current) {
  return ['Н', 'Ж', 'П'].map((g) =>
    `<option value="${g}"${g === current ? ' selected' : ''}>${g} — ${t(`group.${g}`)}</option>`).join('');
}

// Выбор времени списком (шаг 15 мин) вместо нативного поля: выбор вместо
// набора, формат всегда 24-часовой независимо от языка браузера
export function timeSelect(cls, value = '', optional = false) {
  let hasCurrent = !value;
  const rows = [];
  for (let m = 0; m < 1440; m += 15) {
    const v = minutesToTime(m);
    if (v === value) hasCurrent = true;
    rows.push(`<option value="${v}"${v === value ? ' selected' : ''}>${v}</option>`);
  }
  // нестандартное время (не кратно 15) всё равно показывается
  if (!hasCurrent) rows.unshift(`<option value="${value}" selected>${value}</option>`);
  const empty = optional ? `<option value=""${value ? '' : ' selected'}>—</option>` : '';
  return `<select class="${cls}">${empty}${rows.join('')}</select>`;
}

// Пара полей «Начало / Конец»
export function timeRangeFields(start = '09:00', end = '10:00') {
  return `
    <div class="row">
      <label>${t('common.start')} ${timeSelect('js-start', start)}</label>
      <label>${t('common.end')} ${timeSelect('js-end', end)}</label>
    </div>`;
}
