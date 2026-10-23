// Точка входа: вкладки, экраны, цикл напоминаний

import './styles.css';
import { initDayScreen } from './ui/dayScreen.js';
import { initSpheresScreen } from './ui/spheresScreen.js';
import { initInputScreen } from './ui/inputScreen.js';
import { startReminderLoop, fireNotification, requestPermission } from './core/reminders.js';
import { getDueReminders, updateTask } from './core/storage.js';

const screens = {
  day: document.getElementById('tab-day'),
  spheres: document.getElementById('tab-spheres'),
  input: document.getElementById('tab-input'),
};

initDayScreen(screens.day);
initSpheresScreen(screens.spheres);
initInputScreen(screens.input);

const buttons = document.querySelectorAll('nav button');

function showTab(name) {
  for (const [key, el] of Object.entries(screens)) el.hidden = key !== name;
  buttons.forEach((b) => b.classList.toggle('active', b.dataset.tab === name));
  document.dispatchEvent(new CustomEvent('tab-shown', { detail: name }));
}

buttons.forEach((b) => b.addEventListener('click', () => showTab(b.dataset.tab)));
showTab('day');

// Уведомления: разрешение спрашиваем кнопкой, затем работает цикл напоминаний
const bell = document.getElementById('bell');
function refreshBell() {
  bell.hidden = typeof Notification !== 'undefined' && Notification.permission === 'granted';
}
bell.addEventListener('click', async () => {
  await requestPermission();
  refreshBell();
});
refreshBell();

startReminderLoop(
  (now) => getDueReminders(now),
  (task) => {
    fireNotification(task);
    updateTask(task.id, { dueAt: null }); // напоминание разовое
  }
);
