// демо-набор для нового аккаунта: пример дня второй смены — рутины,
// направления и дела, чтобы экран дня не встречал пустотой.
// записи помечены demo: true и убираются кнопкой «Убрать тестовые данные».

import { Sphere, Practice, Task } from './models.js';
import { getAllSpheres, getPractices, getTasks, saveSphere, savePractice, saveTask } from './storage.js';
import { log } from './log.js';

const WEEKDAYS = [1, 2, 3, 4, 5];
const EVERY_DAY = [1, 2, 3, 4, 5, 6, 7];

function makeSpheres() {
  return [
    new Sphere({ id: crypto.randomUUID(), name: 'Школа', group: 'П', brief: 'уроки — сразу после школы', demo: true }),
    new Sphere({ id: crypto.randomUUID(), name: 'Дом', group: 'Н', brief: 'бытовые дела', demo: true }),
    new Sphere({ id: crypto.randomUUID(), name: 'Отдых', group: 'Ж', brief: 'время для себя', demo: true }),
  ];
}

function makePractices(sphereId) {
  const school = sphereId['Школа'];
  const home = sphereId['Дом'];
  return [
    new Practice({ id: crypto.randomUUID(), title: 'Сон', days: EVERY_DAY, start: 1380, end: 420, demo: true }),
    new Practice({ id: crypto.randomUUID(), title: 'Завтрак', days: EVERY_DAY, start: 450, end: 480, demo: true }),
    new Practice({ id: crypto.randomUUID(), title: 'Дорога в школу', days: WEEKDAYS, start: 780, end: 810, sphereId: school, demo: true }),
    new Practice({ id: crypto.randomUUID(), title: 'Учёба', days: WEEKDAYS, start: 810, end: 1080, sphereId: school, demo: true }),
    new Practice({ id: crypto.randomUUID(), title: 'Дорога домой', days: WEEKDAYS, start: 1080, end: 1110, sphereId: school, demo: true }),
    new Practice({ id: crypto.randomUUID(), title: 'Ужин', days: EVERY_DAY, start: 1110, end: 1140, sphereId: home, demo: true }),
  ];
}

function makeTasks(sphereId) {
  return [
    new Task({ id: crypto.randomUUID(), title: 'сделать уроки на 60 минут', group: 'П', sphereId: sphereId['Школа'], durationMin: 60, source: 'manual', demo: true }),
    new Task({ id: crypto.randomUUID(), title: 'погулять на 30 минут', group: 'Ж', sphereId: sphereId['Отдых'], durationMin: 30, source: 'manual', demo: true }),
    new Task({ id: crypto.randomUUID(), title: 'вынести мусор на 10 минут', group: 'Н', sphereId: sphereId['Дом'], durationMin: 10, source: 'manual', demo: true }),
  ];
}

// сидируется только полностью пустой аккаунт — свои данные никогда не трогаем
export async function seedDemoIfEmpty() {
  const [allSpheres, allPractices, allTasks] = await Promise.all([getAllSpheres(), getPractices(), getTasks()]);
  if (allSpheres.length || allPractices.length || allTasks.length) return false;

  const saved = makeSpheres();
  for (const s of saved) await saveSphere(s);
  const byName = Object.fromEntries(saved.map((s) => [s.name, s.id]));
  const practices = makePractices(byName);
  for (const p of practices) await savePractice(p);
  for (const t of makeTasks(byName)) await saveTask(t);
  log.info('demo.seeded', { spheres: saved.length, practices: practices.length, tasks: 3 });
  return true;
}
