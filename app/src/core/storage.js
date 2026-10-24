// Слой хранения: IndexedDB через Dexie.
// Единственная точка доступа к данным — всё остальное работает через этот модуль.

import Dexie from 'dexie';
import { Sphere, Task, Practice } from './models.js';
import { normalizeImport } from './serialization.js';
import { log, setSink, LEVELS } from './log.js';

const db = new Dexie('daylik');

db.version(1).stores({
  spheres: 'id, name, group',
  tasks: 'id, sphereId, group, status, dueAt',
});

db.version(2).stores({
  practices: 'id, sphereId',
});

db.version(3).stores({
  logs: '++id, time, level',
});

export async function saveSphere(sphere) {
  await db.spheres.put(sphere);
  return sphere;
}

export async function saveTask(task) {
  await db.tasks.put(task);
  return task;
}

export async function getAllSpheres() {
  const rows = await db.spheres.toArray();
  return rows.map((r) => new Sphere(r));
}

export async function getTasks({ status = null, group = null } = {}) {
  let col = db.tasks;
  if (status || group) {
    col = col.filter((t) => (!status || t.status === status) && (!group || t.group === group));
  }
  const rows = await col.toArray();
  return rows.map((r) => new Task(r));
}

export async function updateTask(id, patch) {
  await db.tasks.update(id, patch);
}

export async function deleteTask(id) {
  await db.tasks.delete(id);
}

// Задачи с наступившим временем напоминания.
// Фильтр по месту: в IndexedDB null меньше числа и попал бы в выборку belowThanOrEqual.
export async function getDueReminders(now) {
  const rows = await db.tasks.filter((t) => t.dueAt && t.dueAt <= now && t.status !== 'done').toArray();
  return rows.map((r) => new Task(r));
}

export async function savePractice(practice) {
  await db.practices.put(practice);
  return practice;
}

export async function getPractices() {
  const rows = await db.practices.toArray();
  return rows.map((r) => new Practice(r));
}

export async function deletePractice(id) {
  await db.practices.delete(id);
}

// Сфера удаляется вместе со своими практиками
export async function deleteSphere(id) {
  await db.spheres.delete(id);
  await db.practices.where('sphereId').equals(id).delete();
}

// Экспорт/импорт всех данных (см. serialization.js)
export async function exportAll() {
  const data = {
    spheres: await db.spheres.toArray(),
    tasks: await db.tasks.toArray(),
    practices: await db.practices.toArray(),
  };
  log.info('storage.export', { spheres: data.spheres.length, tasks: data.tasks.length, practices: data.practices.length });
  return data;
}

// Импорт с полной заменой текущих данных; возвращает очищенные записи
export async function importAll(data) {
  const clean = normalizeImport(data);
  await db.transaction('rw', db.spheres, db.tasks, db.practices, async () => {
    await db.spheres.clear();
    await db.tasks.clear();
    await db.practices.clear();
    await db.spheres.bulkAdd(clean.spheres);
    await db.tasks.bulkAdd(clean.tasks);
    await db.practices.bulkAdd(clean.practices);
  });
  log.info('storage.import', { spheres: clean.spheres.length, tasks: clean.tasks.length, practices: clean.practices.length });
  return clean;
}

// Журнал: записи пишутся в таблицу logs, хвост длиннее LOG_CAP подрезается
const LOG_CAP = 1000;

export function initLog() {
  setSink(async (entry) => {
    await db.logs.add(entry);
    const count = await db.logs.count();
    if (count > LOG_CAP) {
      const excess = await db.logs.orderBy('id').limit(count - LOG_CAP).primaryKeys();
      await db.logs.bulkDelete(excess);
    }
  });
}

// Последние записи журнала из базы (переживают перезапуск), сначала новые
export async function getLogs({ limit = 200, minLevel = null } = {}) {
  let rows = await db.logs.orderBy('time').reverse().limit(1000).toArray();
  if (minLevel) {
    const min = LEVELS[minLevel] ?? 0;
    rows = rows.filter((r) => (LEVELS[r.level] ?? 0) >= min);
  }
  return rows.slice(0, limit);
}

export async function clearLogs() {
  await db.logs.clear();
  log.info('log.cleared');
}
