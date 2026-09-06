-- ============================================================================
-- Миграция 013: Объединение «Aritmētika un skaitļi» в единый «Algebra un skaitļi»
-- ============================================================================
-- По стандарту Skola2030 фундаментальная линия от 1 до 12 класса называется
-- «Algebra un skaitļi» («Алгебра и числа»).
--
-- Что делает этот скрипт:
-- 1. Переносит все темы 1–9 классов из 'aritmetika-un-skaitli' в 'algebra'.
-- 2. Безопасно удаляет ставший пустым раздел 'aritmetika-un-skaitli'.
-- 3. Нормализует порядок разделов, ставя 'Algebra un skaitļi' на 1-ю позицию.
--
-- Инструкция по запуску:
-- Supabase Dashboard -> SQL Editor -> New query -> Вставить -> Run
-- ============================================================================

BEGIN;

-- 1. Перенос всех тем 1–9 классов в единый раздел 'Algebra un skaitļi'
UPDATE public.topics
SET subject_id = (SELECT id FROM public.subjects WHERE slug = 'algebra')
WHERE subject_id = (SELECT id FROM public.subjects WHERE slug = 'aritmetika-un-skaitli');

-- 2. Удаление пустого дублирующего раздела
DELETE FROM public.subjects
WHERE slug = 'aritmetika-un-skaitli';

-- 3. Упорядочивание позиций разделов (Algebra un skaitļi — первая)
UPDATE public.subjects SET position = 1 WHERE slug = 'algebra';
UPDATE public.subjects SET position = 2 WHERE slug = 'geometry';
UPDATE public.subjects SET position = 3 WHERE slug = 'kombinatorika-un-varbutibas';
UPDATE public.subjects SET position = 4 WHERE slug = 'funktsii-1788575457265';
UPDATE public.subjects SET position = 5 WHERE slug = 'trigonometriya-1788575906149';
UPDATE public.subjects SET position = 6 WHERE slug = 'planimetrija';
UPDATE public.subjects SET position = 7 WHERE slug = 'stereometriya-1788575928591';
UPDATE public.subjects SET position = 8 WHERE slug = 'statistics';
UPDATE public.subjects SET position = 9 WHERE slug = 'matematicheskiy-analiz-1788575978728';

COMMIT;
