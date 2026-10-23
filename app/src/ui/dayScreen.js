// Экран «День»: расписание практик на сегодня (черновик, полный таймлайн — следующий этап)

import { getPractices } from '../core/storage.js';
import { practiceAppliesOn, minutesToTime } from '../core/schedule.js';
import { escapeHtml } from './dom.js';

export function initDayScreen(root) {
  async function render() {
    const practices = await getPractices();
    const today = ((new Date().getDay() + 6) % 7) + 1; // 1 = понедельник
    const todays = practices
      .filter((p) => practiceAppliesOn(p, today))
      .sort((a, b) => a.start - b.start);

    root.innerHTML = `
      <h2>Сегодня</h2>
      ${todays.length
        ? todays.map((p) => `
          <div class="day-row">
            <span class="time">${minutesToTime(p.start)}–${minutesToTime(p.end)}</span>${escapeHtml(p.title)}
          </div>`).join('')
        : '<p class="muted">Расписание на сегодня пустое. Добавь практики в разделе «Сферы».</p>'}
      <p class="muted">Таймлайн со свободными окнами и подбором дел — в разработке.</p>`;
  }

  document.addEventListener('tab-shown', (e) => {
    if (e.detail === 'day') render();
  });

  render();
}
