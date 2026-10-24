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
import { dayNames } from '../core/schedule.js';

export function daysCheckboxes(selected = [1, 2, 3, 4, 5, 6, 7]) {
  return dayNames().map((d, i) =>
    `<label class="day"><input type="checkbox" data-day="${i + 1}"${selected.includes(i + 1) ? ' checked' : ''}>${d}</label>`
  ).join('');
}
