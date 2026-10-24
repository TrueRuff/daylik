// Клиент LLM API (OpenRouter, бесплатный тариф).
// Ключ и модель берутся из .env (VITE_OPENROUTER_API_KEY, VITE_LLM_MODEL, см. .env.example).
// Любая ошибка — нет ключа, сеть, HTTP, неожиданный ответ — даёт null: разбор падает на правила.

const API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const REQUEST_TIMEOUT_MS = 20000;

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

export async function categorizeWithLlm(rawText) {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
  if (!apiKey) return null;

  const model = import.meta.env.VITE_LLM_MODEL || 'google/gemma-4-31b-it:free';

  let response;
  try {
    response = await fetch(API_URL, {
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
        max_tokens: 200,
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch {
    return null;
  }
  if (!response.ok) return null;

  const data = await response.json().catch(() => null);
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== 'string') return null;

  return parseLlmAnswer(content);
}

// Модели обрамляют JSON пояснениями или ```-блоками — берём текст между первой { и последней }
function parseLlmAnswer(text) {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end <= start) return null;

  let parsed;
  try {
    parsed = JSON.parse(text.slice(start, end + 1));
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
