// Точка входа: вход в аккаунт, вкладки, экраны, цикл напоминаний, язык интерфейса

import './styles.css';
import '@fontsource-variable/inter';
import { initDayScreen } from './ui/dayScreen.js';
import { initCalendarScreen } from './ui/calendarScreen.js';
import { initSpheresScreen } from './ui/spheresScreen.js';
import { initInputScreen } from './ui/inputScreen.js';
import { initLogScreen } from './ui/logScreen.js';
import { initAuthScreen } from './ui/authScreen.js';
import { startReminderLoop, fireNotification, requestPermission } from './core/reminders.js';
import { getDueReminders, updateTask, initLog, setDataOwner } from './core/storage.js';
import { restoreSession, logout as authLogout, isAdmin } from './core/auth.js';
import { log } from './core/log.js';
import { getLang, setLang, onChange, applyStatic, t } from './core/i18n.js';

const screens = {
  day: document.getElementById('tab-day'),
  calendar: document.getElementById('tab-calendar'),
  spheres: document.getElementById('tab-spheres'),
  input: document.getElementById('tab-input'),
  log: document.getElementById('tab-log'),
};

const appEl = document.getElementById('app');
const authRoot = document.getElementById('auth');
const whoEl = document.getElementById('who');
const avatarEl = document.getElementById('who-avatar');
const logoutBtn = document.getElementById('logout');
const langBtn = document.getElementById('lang');
const logTabBtn = document.querySelector('nav button[data-tab="log"]');

initLog();

initDayScreen(screens.day);
initCalendarScreen(screens.calendar);
initSpheresScreen(screens.spheres);
initInputScreen(screens.input);
initLogScreen(screens.log);

const buttons = document.querySelectorAll('nav button');
let currentTab = 'day';
let account = null; // вошедший аккаунт (auth.js)

function showTab(name) {
  currentTab = name;
  for (const [key, el] of Object.entries(screens)) el.hidden = key !== name;
  buttons.forEach((b) => b.classList.toggle('active', b.dataset.tab === name));
  document.dispatchEvent(new CustomEvent('tab-shown', { detail: name }));
}

buttons.forEach((b) => b.addEventListener('click', () => {
  if (b.dataset.tab === 'log' && !isAdmin(account)) return; // журнал — только админу
  showTab(b.dataset.tab);
}));

// ---------- вход и выход ----------

function enterApp(acc) {
  account = acc;
  setDataOwner(acc.login); // дальнейшие чтения и записи — только его данные
  authRoot.hidden = true;
  appEl.hidden = false;
  whoEl.hidden = false;
  whoEl.textContent = acc.login;
  avatarEl.hidden = false;
  avatarEl.textContent = (acc.login[0] || '?').toUpperCase();
  logoutBtn.hidden = false;
  langBtn.hidden = false;
  themeBtn.hidden = false;
  logTabBtn.hidden = !isAdmin(acc);
  refreshBell();
  showTab('day');
}

function showLogin() {
  account = null;
  setDataOwner(null);
  authRoot.hidden = false;
  appEl.hidden = true;
  whoEl.hidden = true;
  avatarEl.hidden = true;
  logoutBtn.hidden = true;
  langBtn.hidden = true;
  authScreen.show();
}

logoutBtn.addEventListener('click', () => {
  log.info('auth.logout', { login: account?.login });
  authLogout();
  showLogin();
});

const authScreen = initAuthScreen(authRoot, enterApp);

// Сессия из прошлого запуска: валидный токен — сразу в приложение,
// иначе экран входа (там же при первом запуске создаётся встроенный админ)
restoreSession().then((acc) => {
  if (acc) enterApp(acc);
  else showLogin();
  log.info('app.start', { lang: getLang(), account: acc?.login ?? null });
});

// Язык: кнопка показывает язык, на который переключит; смена перерисовывает экраны

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
  if (account) showTab(currentTab); // перерисовать активный экран на новом языке
});

applyStatic();
refreshLangBtn();

// Тема: светлая/тёмная, старт — по сохранённому выбору или системной
// (первичная установка делает inline-скрипт в index.html до отрисовки)
const themeBtn = document.getElementById('theme');
const THEME_KEY = 'daylik-theme';

function currentTheme() {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

const SUN_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2.5V5M12 19v2.5M2.5 12H5M19 12h2.5M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M19.1 4.9l-1.8 1.8M6.7 17.3l-1.8 1.8"/></svg>';
const MOON_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 14.5A8 8 0 1 1 9.5 4 6.5 6.5 0 0 0 20 14.5z"/></svg>';

function refreshThemeBtn() {
  themeBtn.innerHTML = currentTheme() === 'dark' ? SUN_SVG : MOON_SVG;
}

themeBtn.addEventListener('click', () => {
  const next = currentTheme() === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  try {
    localStorage.setItem(THEME_KEY, next);
  } catch {
    // сохранение не критично
  }
  refreshThemeBtn();
  log.info('theme.change', { theme: next });
});
refreshThemeBtn();

// Уведомления: разрешение спрашиваем кнопкой, затем работает цикл напоминаний
const bell = document.getElementById('bell');
function refreshBell() {
  bell.hidden = typeof Notification !== 'undefined' && Notification.permission === 'granted';
}
bell.addEventListener('click', async () => {
  await requestPermission();
  refreshBell();
});

startReminderLoop(
  (now) => getDueReminders(now),
  (task) => {
    fireNotification(task);
    updateTask(task.id, { dueAt: null }); // напоминание разовое
  }
);

// PWA: service worker только в продакшн-сборке (на dev-сервере кэш мешал бы
// свежему коду), в браузере по http/https; Electron работает с file://
if (import.meta.env.PROD && 'serviceWorker' in navigator && location.protocol.startsWith('http')) {
  navigator.serviceWorker.register('./sw.js').catch((err) => {
    log.warn('sw.registerFailed', { message: err?.message });
  });
}
