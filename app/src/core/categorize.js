// Гибридный разбор ввода: сначала локальные правила (словарь + регулярки),
// при низкой уверенности — внешний LLM API (см. src/ai/llmClient.js).
// Контракт: categorize(rawText) → { kind, title, group, durationMin?, repeatRule?, confidence, provider }

import { categorizeWithLlm } from '../ai/llmClient.js';

// Словарь правил: ключевое слово/регулярка → разбор.
// Порядок важен: первый совпавший шаблон побеждает.
const RULES = [
  {
    // «читать 20 страниц в день», «бегать каждое утро» → практика с повтором
    // (\b в JS не работает с кириллицей — границы слов не используем)
    pattern: /(каждый день|ежедневно|в день|каждое утро|каждый вечер)/i,
    kind: 'routine',
    group: 'П',
    titleFrom: (raw) => raw.replace(/\s*(каждый день|ежедневно|в день|каждое утро|каждый вечер)\s*/i, ' ').trim(),
    confidence: 0.8,
  },
  {
    // «хочу научиться X», «хочу разобраться в X» → предложение создать сферу
    pattern: /^(хочу|мечтаю)\s+(научиться|освоить|разобраться|начать)\s+/i,
    kind: 'sphere',
    group: 'Ж',
    titleFrom: (raw) => raw.replace(/^(хочу|мечтаю)\s+(научиться|освоить|разобраться|начать)\s+/i, '').trim(),
    confidence: 0.7,
  },
  {
    // «помыть пол», «купить хлеб» → бытовое разовое дело, группа Н
    pattern: /^(помыть|вымыть|убрать|купить|вынести|покормить|полить|позвонить|заплатить|сдать|отнести)/i,
    kind: 'task',
    group: 'Н',
    durationMin: 30,
    confidence: 0.9,
  },
];

export function categorizeByRules(rawText) {
  const raw = rawText.trim();
  for (const rule of RULES) {
    const m = raw.match(rule.pattern);
    if (!m) continue;

    const result = {
      kind: rule.kind,
      title: rule.titleFrom ? rule.titleFrom(raw) : raw,
      group: rule.group,
      confidence: rule.confidence,
      provider: 'rules',
    };
    if (rule.durationMin) result.durationMin = rule.durationMin;
    if (rule.kind === 'routine') result.repeatRule = 'daily';
    return result;
  }

  // Ничего не распознали
  return { kind: 'task', title: raw, group: null, confidence: 0.1, provider: 'rules' };
}

const CONFIDENCE_THRESHOLD = 0.5;

export async function categorize(rawText) {
  const rulesResult = categorizeByRules(rawText);
  if (rulesResult.confidence >= CONFIDENCE_THRESHOLD) return rulesResult;

  // Низкая уверенность — пробуем внешний LLM; недоступен → работаем на правилах
  try {
    const llmResult = await categorizeWithLlm(rawText);
    if (llmResult) return llmResult;
  } catch {
    // деградация, а не отказ
  }
  return { ...rulesResult, llmFailed: true };
}
