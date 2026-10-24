// Планировщик напоминаний (обязательная функция темы).
// Каркас: проверка раз в минуту, при наступлении времени — Notifications API.

import { log } from './log.js';
import { t } from './i18n.js';

export function startReminderLoop(getDueReminders, onFire, intervalMs = 60_000) {
  const tick = async () => {
    const due = await getDueReminders(Date.now());
    for (const task of due) onFire(task);
  };
  const timer = setInterval(tick, intervalMs);
  return () => clearInterval(timer);
}

export async function requestPermission() {
  if (typeof Notification === 'undefined') return 'unsupported';
  return Notification.requestPermission();
}

export function fireNotification(task) {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
  log.info('reminder.fired', { title: task.title });
  new Notification(t('app.name'), { body: task.title, tag: task.id });
}
