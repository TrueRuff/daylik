// Точка входа: вкладки, экраны, цикл напоминаний, язык интерфейса

import './styles.css';
import { initDayScreen } from './ui/dayScreen.js';
import { initSpheresScreen } from './ui/spheresScreen.js';
import { initInputScreen } from './ui/inputScreen.js';
import { initLogScreen } from './ui/logScreen.js';
import { startReminderLoop, fireNotification, requestPermission } from './core/reminders.js';
import { getDueReminders, updateTask, initLog } from './core/storage.js';
import { log } from './core/log.js';
import { getLang, setLang, onChange, applyStatic, t } from './core/i18n.js';

const screens = {
  day: document.getElementById('tab-day'),
  spheres: document.getElementById('tab-spheres'),
  input: document.getElementById('tab-input'),
  log: document.getElementById('tab-log'),
};

initLog();

initDayScreen(screens.day);
initSpheresScreen(screens.spheres);
initInputScreen(screens.input);
initLogScreen(screens.log);

const buttons = document.querySelectorAll('nav button');
let currentTab = 'day';

function showTab(name) {
  currentTab = name;
  for (const [key, el] of Object.entries(screens)) el.hidden = key !== name;
  buttons.forEach((b) => b.classList.toggle('active', b.dataset.tab === name));
  document.dispatchEvent(new CustomEvent('tab-shown', { detail: name }));
}

buttons.forEach((b) => b.addEventListener('click', () => showTab(b.dataset.tab)));
showTab('day');

// Язык: кнопка показывает язык, на который переключит; смена перерисовывает экраны
const langBtn = document.getElementById('lang');

function refreshLangBtn() {
  langBtn.textContent = getLang() === 'ru' ? 'EN' : 'RU';
}

langBtn.addEventListener('click', () => {
  setLang(getLang() === 'ru' ? 'en' : 'ru');
});

onChange(() => {
  document.title = `${t('app.name')} — ${t('nav.day')}`;
  applyStatic();
  refreshLangBtn();
  showTab(currentTab); // перерисовать активный экран на новом языке
});

applyStatic();
refreshLangBtn();

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

log.info('app.start', { lang: getLang() });

// PWA: service worker только в продакшн-сборке (на dev-сервере кэш мешал бы
// свежему коду), в браузере по http/https; Electron работает с file://
if (import.meta.env.PROD && 'serviceWorker' in navigator && location.protocol.startsWith('http')) {
  navigator.serviceWorker.register('./sw.js').catch((err) => {
    log.warn('sw.registerFailed', { message: err?.message });
  });
}
