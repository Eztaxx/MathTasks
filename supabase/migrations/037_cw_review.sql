-- Миграция 037: ручная проверка контрольных учителем
--
-- Зачем. В админке («Результаты учеников») учитель смотрит ответ ученика
-- рядом с правильным и сам ставит за задание 0, ½ или 1 балл — например,
-- когда ученик отметил «Ответ всё же совпал» или записал ответ иначе.
-- Итог учителя (баллы, процент, оценка по той же шкале) считает админка.
--
-- Что хранится. В review — только задания, где учитель поставил балл сам:
-- {"<task_id>": 0 | 0.5 | 1}. Автопроверка (answers[].ok, score, grade)
-- остаётся как была. Ученик проверку учителя не видит.
-- cw_submission_save при повторной отправке той же попытки (в течение
-- 2 часов) переписывает только score/percent/grade/answers/updated_at —
-- review и reviewed_at не затираются; если ученик изменил работу после
-- проверки, админка видит это по updated_at > reviewed_at.
--
-- Кто пишет. Только администратор, через функцию cw_submission_review.
-- Права UPDATE на таблицу ни у кого из посетителей нет.
--
-- Запускать в Supabase: SQL Editor → New query → Run. Миграция только
-- добавляет — её можно запустить до или после выкладки сайта.

alter table public.cw_submissions
  add column if not exists review jsonb not null default '{}'::jsonb,
  add column if not exists reviewed_at timestamptz;

alter table public.cw_submissions drop constraint if exists cw_submissions_review_object;
alter table public.cw_submissions add constraint cw_submissions_review_object check (jsonb_typeof(review) = 'object');

/* Одно действие учителя над одной сдачей:
     'mark'    — балл p_value (0, 0.5 или 1) за задание p_task; p_value null — убрать балл;
     'checked' — отметить работу проверенной (баллы не меняются);
     'reset'   — убрать все баллы, работа снова не проверена.
   Балл сливается с уже стоящими на сервере, а не заменяет их: два быстрых
   клика или две вкладки не затирают друг друга.
   p_seen — updated_at сдачи, которую видел учитель. Если ученик с тех пор
   изменил работу («Ответ всё же совпал»), ничего не меняем и отвечаем
   stale — админка покажет свежие ответы. Ответ — свежая строка. */
create or replace function public.cw_submission_review(
  p_id bigint, p_action text, p_task bigint default null, p_value numeric default null, p_seen timestamptz default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  sub public.cw_submissions%rowtype;
  stale boolean := false;
begin
  if not public.is_admin() then raise exception 'admin_only'; end if;
  select * into sub from public.cw_submissions s where s.id = p_id for update;
  if not found then raise exception 'cw_submission_review: not_found'; end if;

  if p_seen is not null and sub.updated_at > p_seen + interval '1 second' then
    stale := true;
  elsif p_action = 'mark' then
    if p_task is null or not exists (select 1 from jsonb_array_elements(sub.answers) a where a->>'task_id' = p_task::text) then
      raise exception 'cw_submission_review: task';
    end if;
    if p_value is null then
      sub.review := sub.review - p_task::text;
    elsif p_value in (0, 0.5, 1) then
      sub.review := sub.review || jsonb_build_object(p_task::text, p_value);
    else
      raise exception 'cw_submission_review: value';
    end if;
    sub.reviewed_at := now();
  elsif p_action = 'checked' then
    sub.reviewed_at := now();
  elsif p_action = 'reset' then
    sub.review := '{}'::jsonb;
    sub.reviewed_at := null;
  else
    raise exception 'cw_submission_review: action';
  end if;

  if not stale then
    update public.cw_submissions s set review = sub.review, reviewed_at = sub.reviewed_at where s.id = p_id;
  end if;
  return jsonb_build_object('stale', stale, 'review', sub.review, 'reviewed_at', sub.reviewed_at,
    'updated_at', sub.updated_at, 'answers', sub.answers, 'score', sub.score, 'percent', sub.percent, 'grade', sub.grade);
end;
$$;

revoke all on function public.cw_submission_review(bigint, text, bigint, numeric, timestamptz) from public, anon, authenticated;
grant execute on function public.cw_submission_review(bigint, text, bigint, numeric, timestamptz) to authenticated;
