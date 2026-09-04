/**
 * Cloudflare Pages Function: /api/generate-task
 * Генерация математических задач по стандарту Skola2030 через Google Gemini API
 */

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const {
      grade = 7,
      topicTitle = 'Линейные уравнения',
      subtopic = '',
      difficulty = 'Средний',
      taskType = 'Уравнение',
      context = '',
      customPrompt = '',
      apiKey = ''
    } = body || {};

    const activeApiKey = apiKey || env.GEMINI_API_KEY;
    if (!activeApiKey) {
      return new Response(JSON.stringify({
        error: 'API-ключ Gemini не указан. Задайте GEMINI_API_KEY в переменных окружения или передайте apiKey в запросе.'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const prompt = `Ты — ведущий методист и преподаватель математики в Латвии, создающий учебные материалы строго по государственному стандарту Skola2030.
Создай качественную математическую задачу для ${grade} класса.
Тема Skola2030: "${topicTitle}".
${subtopic ? `Конкретный навык/подтема: "${subtopic}".` : ''}
Сложность: ${difficulty || 'Средний'} (Лёгкий = pamata līmenis, Средний = optimālais līmenis, Сложный = padziļinātais līmenis).
Тип задачи: ${taskType || 'Уравнение или текстовая задача'}.
${context ? `Сюжетный контекст задачи (ОБЯЗАТЕЛЬНО составь условие задачи именно про этот жизненный сюжет или ситуацию): "${context}".` : ''}
${customPrompt ? `Дополнительные пожелания: "${customPrompt}".` : ''}

Требования:
1. Математическая точность: условие должно иметь ровно одно корректное решение, ответ должен быть строго выверен.
2. Формулы: оформляй все переменные, числа в вычислениях и формулы в KaTeX-разметке: внутри $...$ для инлайн и $$...$$ для выключных формул.
3. Локализация: создай полные версии на русском (RU), латышском (LV) и английском (EN) языках. Латышский текст должен строго соответствовать терминологии Skola2030.
4. Ответ верни СТРОГО в формате валидного JSON-объекта (без markdown-блоков):
{
  "title_ru": "Краткое название задачи",
  "title_lv": "Nosaukums latviski",
  "title_en": "Title in English",
  "condition_latex_ru": "Условие задачи с формулами $...$",
  "condition_latex_lv": "Nosacījums ar formulām $...$",
  "condition_latex_en": "Condition with formulas $...$",
  "answer_latex": "Короткий математический ответ",
  "solution_latex_ru": "Пошаговое понятное решение с формулами",
  "solution_latex_lv": "Soli pa solim atrisinājums latviski",
  "solution_latex_en": "Step-by-step solution in English"
}`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(activeApiKey)}`;
    const resp = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.3
        }
      })
    });

    if (!resp.ok) {
      const err = await resp.text();
      return new Response(JSON.stringify({ error: `Gemini API error: ${err}` }), {
        status: resp.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const data = await resp.json();
    const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) {
      return new Response(JSON.stringify({ error: 'Пустой ответ от модели' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const cleanJson = candidateText.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
    const parsed = JSON.parse(cleanJson);

    return new Response(JSON.stringify({
      success: true,
      task: {
        ...parsed,
        grade: Number(grade) || 7,
        difficulty: difficulty || 'Средний'
      }
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
