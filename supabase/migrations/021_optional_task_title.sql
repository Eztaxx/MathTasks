-- 021: Make tasks.title optional with empty string default
-- Tasks are identified by condition, subtopic, topic, and per-topic number (position).
ALTER TABLE public.tasks ALTER COLUMN title DROP NOT NULL;
ALTER TABLE public.tasks ALTER COLUMN title SET DEFAULT '';
