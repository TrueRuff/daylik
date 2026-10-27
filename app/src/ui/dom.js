// экранирование пользовательского текста перед вставкой в разметку
export function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

// скачивание файла через временный <a download>
export function downloadFile(name, blob) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}

// чекбоксы дней недели (1..7) — квадратики вплотную, состояние внутри плитки
import { dayNames, todayStr, addDays, localInputToTs } from '../core/schedule.js';
import { t } from '../core/i18n.js';

export function daysCheckboxes(selected = [1, 2, 3, 4, 5, 6, 7]) {
  return dayNames().map((d, i) =>
    `<label class="day"><input type="checkbox" data-day="${i + 1}"${selected.includes(i + 1) ? ' checked' : ''}><span>${d}</span></label>`
  ).join('');
}

// опции селекта групп Н/Ж/П с выделенной текущей
export function groupOptions(current) {
  return ['Н', 'Ж', 'П'].map((g) =>
    `<option value="${g}"${g === current ? ' selected' : ''}>${g} — ${t(`group.${g}`)}</option>`).join('');
}

// поле времени: 4 цифры (две в часы, две в минуты), двоеточие появляется само
export function timeInput(cls, value = '', optional = false) {
  return `<input class="js-time ${cls}" type="text" inputmode="numeric" maxlength="5"
    placeholder="${optional ? '—' : '09:00'}" value="${value}">`;
}

// приведение набранного к 'ЧЧ:ММ'; пусто или мусор — пустая строка
export function normalizeTimeValue(value) {
  const digits = String(value || '').replace(/\D/g, '').slice(0, 4);
  if (!digits) return '';
  const hh = Math.min(23, Number(digits.length > 2 ? digits.slice(0, -2) : digits));
  const mm = digits.length > 2 ? Math.min(59, Number(digits.slice(-2))) : 0;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

// маска времени: двоеточие при вводе, нормализация при потере фокуса
export function bindTimeMasks(root) {
  root.addEventListener('input', (e) => {
    if (!e.target.classList.contains('js-time')) return;
    const digits = e.target.value.replace(/\D/g, '').slice(0, 4);
    e.target.value = digits.length > 2
      ? `${digits.slice(0, -2)}:${digits.slice(-2)}`
      : digits;
  });
  const fix = (e) => {
    if (!e.target.classList.contains('js-time')) return;
    e.target.value = normalizeTimeValue(e.target.value);
  };
  root.addEventListener('focusout', fix);
  root.addEventListener('change', fix);
}

// пара полей «Начало / Конец» — равные колонки, подпись над окошком
export function timeRangeFields(start = '09:00', end = '10:00') {
  return `
    <div class="time-range">
      <label>${t('common.start')} ${timeInput('js-start', start)}</label>
      <label>${t('common.end')} ${timeInput('js-end', end)}</label>
    </div>`;
}

// поле напоминания: быстрые дни чипами + дата и время (4 цифры) по кнопке
export function remindFieldsHtml(prefix, { date = '', time = '09:00', open = false } = {}) {
  return `
    <div class="row">
      <button type="button" class="grp chip" data-remind-days="1" data-remind-for="${prefix}">${t('task.remindTomorrow')}</button>
      <button type="button" class="grp chip" data-remind-days="2" data-remind-for="${prefix}">${t('task.remindDayAfter')}</button>
      <button type="button" class="grp chip" data-remind-days="7" data-remind-for="${prefix}">${t('task.remindWeek')}</button>
      <button type="button" class="grp chip" data-remind-open="${prefix}">${t('task.pickDate')}</button>
    </div>
    <div class="row remind-fields" id="${prefix}-remind-fields" ${open ? '' : 'hidden'}>
      <label>${t('task.remindDate')} <input id="${prefix}-remind-date" type="date" value="${date}"></label>
      <label>${t('task.remindTime')} ${timeInput(`js-${prefix}-remind-time`, time)}</label>
    </div>`;
}

// клик по чипам напоминания; true — клик потрачен
export function handleRemindClick(root, e) {
  const chip = e.target.closest('[data-remind-days]');
  if (chip) {
    const dateInput = root.querySelector(`#${chip.dataset.remindFor}-remind-date`);
    const fields = root.querySelector(`#${chip.dataset.remindFor}-remind-fields`);
    if (dateInput) dateInput.value = addDays(todayStr(), Number(chip.dataset.remindDays));
    if (fields) fields.hidden = false;
    return true;
  }
  const open = e.target.closest('[data-remind-open]');
  if (open) {
    const fields = root.querySelector(`#${open.dataset.remindOpen}-remind-fields`);
    if (fields) fields.hidden = false;
    return true;
  }
  return false;
}

// готовые дата и время из полей напоминания -> timestamp или null
export function readRemindInput(root, prefix) {
  const date = root.querySelector(`#${prefix}-remind-date`)?.value;
  if (!date) return null;
  const time = normalizeTimeValue(root.querySelector(`.js-${prefix}-remind-time`)?.value) || '09:00';
  return localInputToTs(`${date}T${time}`);
}
