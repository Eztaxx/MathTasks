-- ============================================================================
-- Миграция 014: Очистка слагов разделов от временных меток (таймстемпов)
-- ============================================================================
-- Заменяет сгенерированные в админке слаги с таймстемпами (напр. trigonometriya-1788575906149)
-- на чистые лаконичные URL-адреса:
--   /subject/funkcijas
--   /subject/trigonometrija
--   /subject/stereometrija
--   /subject/matematiskais-analizs
--
-- Инструкция:
-- Supabase Dashboard -> SQL Editor -> New query -> Paste -> Run
-- ============================================================================

BEGIN;

UPDATE public.subjects SET slug = 'funkcijas' WHERE slug = 'funktsii-1788575457265';
UPDATE public.subjects SET slug = 'trigonometrija' WHERE slug = 'trigonometriya-1788575906149';
UPDATE public.subjects SET slug = 'stereometrija' WHERE slug = 'stereometriya-1788575928591';
UPDATE public.subjects SET slug = 'matematiskais-analizs' WHERE slug = 'matematicheskiy-analiz-1788575978728';

COMMIT;
