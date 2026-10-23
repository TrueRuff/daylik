// Заглушка внешнего LLM API. Реальная интеграция (OpenRouter / Gemini, бесплатный тариф)
// будет добавлена отдельным шагом — интерфейс уже закреплён.
//
// categorizeWithLlm(rawText) → тот же формат, что categorizeByRules,
// или null (если провайдер не настроен / не смог разобрать).

const LLM_ENABLED = false; // включить после получения API-ключа

export async function categorizeWithLlm(_rawText) {
  if (!LLM_ENABLED) return null;
  // TODO: fetch к провайдеру, парсинг ответа в наш формат, provider: 'llm'
  return null;
}
