// Слой хранения: IndexedDB через Dexie.
// Единственная точка доступа к данным — всё остальное работает через этот модуль.

import Dexie from 'dexie';
import { Sphere, Task, Practice } from './models.js';
import { normalizeImport } from './serialization.js';

const db = new Dexie('daylik');

db.version(1).stores({
  spheres: 'id, name, group',
  tasks: 'id, sphereId, group, status, dueAt',
});

db.version(2).stores({
  practices: 'id, sphereId',
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
  return {
    spheres: await db.spheres.toArray(),
    tasks: await db.tasks.toArray(),
    practices: await db.practices.toArray(),
  };
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
  return clean;
}
