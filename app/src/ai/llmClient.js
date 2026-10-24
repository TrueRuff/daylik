// Клиент LLM API (OpenRouter, бесплатный тариф).
// Ключ и модель берутся из .env (VITE_OPENROUTER_API_KEY, VITE_LLM_MODEL, см. .env.example).
// Любая ошибка — нет ключа, сеть, HTTP, неожиданный ответ — даёт null: разбор падает на правила.

const API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const REQUEST_TIMEOUT_MS = 20000;
const RETRY_DELAY_MS = 2000;
// У бесплатных моделей общий пул: 429/5xx часто уходит за секунды — пробуем ещё раз
const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);
// openrouter/free — роутер: сам выбирает свободную модель из бесплатных
const DEFAULT_MODEL = 'openrouter/free';

const KINDS = new Set(['task', 'routine', 'sphere']);
const GROUPS = new Set(['Н', 'Ж', 'П']);

const SYSTEM_PROMPT = `Ты разбираешь записи планировщика: тебе дают фразу на русском языке.
Верни строго один JSON-объект без пояснений, в формате:
{"kind": "...", "title": "...", "group": "...", "durationMin": число, "repeatRule": "..."}
kind — "task" (разовое дело), "routine" (регулярная практика) или "sphere" (пользователь хочет освоить новое — предложить сферу).
title — короткое название дела, практики или сферы.
group — "Н" (быт и насущное), "Ж" (желания и жизнь) или "П" (практики и развитие).
durationMin — длительность в минутах от 5 до 240, указывай только для task.
repeatRule — "daily" или "weekly", указывай только для routine.`;

async function sendRequest(apiKey, model, rawText) {
  try {
    return await fetch(API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: rawText },
        ],
        temperature: 0,
        // запас на reasoning-токены, иначе у резонеров обрезается сам ответ
        max_tokens: 1000,
        reasoning: { exclude: true },
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch {
    return null;
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function categorizeWithLlm(rawText) {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
  if (!apiKey) return null;

  const model = import.meta.env.VITE_LLM_MODEL || DEFAULT_MODEL;

  let response = await sendRequest(apiKey, model, rawText);
  if (response && RETRYABLE_STATUS.has(response.status)) {
    await delay(RETRY_DELAY_MS);
    response = await sendRequest(apiKey, model, rawText);
  }
  if (!response || !response.ok) return null;

  const data = await response.json().catch(() => null);
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== 'string') return null;

  return parseLlmAnswer(content);
}

// Модели обрамляют JSON пояснениями или ```-блоками, иногда выдают несколько
// объектов подряд — берём первый сбалансированный {...}
function extractFirstJson(text) {
  const start = text.indexOf('{');
  if (start === -1) return null;
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    if (text[i] === '{') depth++;
    else if (text[i] === '}' && --depth === 0) return text.slice(start, i + 1);
  }
  return null;
}

function parseLlmAnswer(text) {
  const json = extractFirstJson(text);
  if (!json) return null;

  let parsed;
  try {
    parsed = JSON.parse(json);
  } catch {
    return null;
  }
  if (!KINDS.has(parsed.kind) || typeof parsed.title !== 'string' || !parsed.title.trim()) return null;

  const result = {
    kind: parsed.kind,
    title: parsed.title.trim(),
    group: GROUPS.has(parsed.group) ? parsed.group : null,
    confidence: 0.6,
    provider: 'llm',
  };
  if (parsed.kind === 'task') {
    const dur = Math.round(Number(parsed.durationMin));
    if (dur >= 5 && dur <= 240) result.durationMin = dur;
  }
  if (parsed.kind === 'routine' && (parsed.repeatRule === 'daily' || parsed.repeatRule === 'weekly')) {
    result.repeatRule = parsed.repeatRule;
  }
  return result;
}
