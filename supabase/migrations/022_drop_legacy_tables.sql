-- 022: Drop legacy empty tables algebra and geometry
-- Subjects are managed in the subjects table and tasks are linked via topics/subtopics.
DROP TABLE IF EXISTS public.algebra CASCADE;
DROP TABLE IF EXISTS public.geometry CASCADE;
