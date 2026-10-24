# Дейлик (app)

Планировщик задач: сферы жизни (Н/Ж/П), таймлайн дня, гибридный разбор ввода (правила → LLM).

## Запуск

```bash
cd app
npm install
npm run dev     # открыть адрес из консоли
npm test        # тесты алгоритмов
npm run build   # production-сборка
```

## LLM-разбор ввода (опционально)

Без настройки ввод разбирается локальными правилами. Для разбора сложных
формулировок через OpenRouter: скопировать `.env.example` в `.env`, вставить
свой ключ (`openrouter.ai → Keys`) и перезапустить `npm run dev`. По умолчанию
стоит роутер `openrouter/free` — сам выбирает свободную модель из бесплатных.

## Структура

```
app/
├── index.html            — точка входа браузера
├── src/
│   ├── main.js           — вкладки, экраны, цикл напоминаний
│   ├── styles.css
│   ├── core/             — алгоритмы и данные
│   │   ├── models.js     — Sphere, Task, Practice, PlanBlock
│   │   ├── storage.js    — IndexedDB через Dexie
│   │   ├── categorize.js — гибридный разбор ввода (правила → LLM)
│   │   ├── dayPlan.js    — таймлайн дня: свободные окна и упаковка дел
│   │   ├── schedule.js   — время и дни недели
│   │   ├── reminders.js  — напоминания (Notifications API)
│   │   └── serialization.js — экспорт/импорт: JSON и двоичный формат .daylik
│   ├── ai/
│   │   └── llmClient.js  — клиент OpenRouter с деградацией на правила
│   └── ui/               — экраны: день (таймлайн), сферы, ввод
└── tests/                — Vitest
```
