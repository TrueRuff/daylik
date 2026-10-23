# Дайлик (app)

Планировщик задач: сферы жизни (Н/Ж/П), таймлайн дня, гибридный разбор ввода (правила → LLM).

## Запуск

```bash
cd app
npm install
npm run dev     # открыть адрес из консоли
npm test        # тесты алгоритмов
npm run build   # production-сборка
```

## Структура

```
app/
├── index.html            — точка входа браузера
├── src/
│   ├── main.js           — UI-каркас (ввод → разбор)
│   ├── core/             — мой блок: алгоритмы и данные
│   │   ├── models.js     — Sphere, Task, PlanBlock
│   │   ├── storage.js    — IndexedDB через Dexie
│   │   ├── categorize.js — гибридный разбор ввода (правила → LLM)
│   │   ├── dayPlan.js    — календарь дня: подбор дел в окна
│   │   └── reminders.js  — планировщик напоминаний
│   └── ai/
│       └── llmClient.js  — заглушка внешнего LLM API
└── tests/                — Vitest
```
