// Точка входа. UI-каркас: одна строка ввода → разбор гибридным ИИ → показ результата.
// Полноценные экраны (таймлайн, сферы) — следующий этап.

import { categorize } from './core/categorize.js';
import { saveTask } from './core/storage.js';
import { Task } from './core/models.js';

const input = document.getElementById('input');
const button = document.getElementById('parse');
const result = document.getElementById('result');

button.addEventListener('click', async () => {
  const raw = input.value.trim();
  if (!raw) return;

  const parsed = await categorize(raw);
  result.textContent = JSON.stringify(parsed, null, 2);

  // Пока показываем разбор; сохранение — после подтверждения пользователя (по концепту)
  if (parsed.kind === 'task') {
    const task = new Task({ id: crypto.randomUUID(), rawText: raw, ...parsed, source: parsed.provider });
    await saveTask(task);
    result.textContent += `\n\nСохранено дело: ${task.title} (группа ${task.group})`;
  }
});
