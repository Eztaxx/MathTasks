-- Миграция 033: напоминание позаниматься (веб-пуш)
--
-- Зачем. Ученик с профилем включает в карточке «Напоминать заниматься» и
-- выбирает час. Раз в час воркер (worker/push.js) спрашивает у базы, кому
-- пора напомнить, и отправляет пуш. Напоминание приходит, только если
-- сегодня ученик ещё не занимался — ни в каталоге (math-tasks:activity), ни
-- в тренажёре или дуэли (math-tasks:trainer-days): это видно по снимку
-- прогресса, который приносит синхронизация.
--
-- Что хранится: адрес подписки браузера и два её ключа (без них пуш не
-- расшифровать), язык, час и часовой пояс. Ни имени, ни почты. Подписка
-- удаляется вместе с профилем, при выключении напоминания и когда сервис
-- пушей отвечает, что её больше нет.
--
-- Запускать в Supabase: SQL Editor → New query → Run (после 032).
-- Пока миграция не применена, переключатель напоминания не показывается.

create table if not exists public.push_subscriptions (
  endpoint text primary key check (endpoint like 'https://%' and char_length(endpoint) < 1024),
  profile_id uuid not null references public.student_profiles(id) on delete cascade,
  p256dh text not null check (char_length(p256dh) < 200),
  auth text not null check (char_length(auth) < 100),
  lang text not null default 'lv' check (lang in ('lv', 'ru')),
  remind_hour smallint not null default 18 check (remind_hour between 0 and 23),
  tz text not null default 'Europe/Riga' check (char_length(tz) < 64),
  last_sent_on date,
  failures int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists idx_push_subscriptions_profile on public.push_subscriptions (profile_id);

-- Прямого доступа к таблице нет ни у кого: только функции ниже.
alter table public.push_subscriptions enable row level security;

-- Включить или обновить напоминание на этом устройстве.
create or replace function public.save_push_subscription(
  p_endpoint text, p_p256dh text, p_auth text, p_lang text, p_hour int, p_tz text
) returns void language plpgsql security definer set search_path = '' as $$
declare
  pid uuid := public.my_profile_id();
  zone text := coalesce(nullif(trim(p_tz), ''), 'Europe/Riga');
begin
  if pid is null then raise exception 'no_profile'; end if;
  -- Неизвестный пояс сломал бы выборку для всех — берём рижский.
  if not exists (select 1 from pg_catalog.pg_timezone_names where name = zone) then zone := 'Europe/Riga'; end if;
  insert into public.push_subscriptions (endpoint, profile_id, p256dh, auth, lang, remind_hour, tz)
    values (p_endpoint, pid, p_p256dh, p_auth,
            case when p_lang = 'ru' then 'ru' else 'lv' end,
            greatest(0, least(23, coalesce(p_hour, 18))), zone)
  on conflict (endpoint) do update set
    profile_id = excluded.profile_id, p256dh = excluded.p256dh, auth = excluded.auth,
    lang = excluded.lang, remind_hour = excluded.remind_hour, tz = excluded.tz, failures = 0;
  -- Больше десяти устройств на профиль не бывает: лишние, самые старые, убираем.
  delete from public.push_subscriptions
    where profile_id = pid and endpoint not in (
      select endpoint from public.push_subscriptions where profile_id = pid order by created_at desc limit 10);
end;
$$;

create or replace function public.delete_push_subscription(p_endpoint text)
returns void language sql security definer set search_path = '' as $$
  delete from public.push_subscriptions where endpoint = p_endpoint and profile_id = public.my_profile_id()
$$;

-- Час напоминания на этом устройстве или null, если оно выключено.
create or replace function public.my_push_reminder(p_endpoint text)
returns smallint language sql stable security definer set search_path = '' as $$
  select remind_hour from public.push_subscriptions where endpoint = p_endpoint and profile_id = public.my_profile_id()
$$;

-- Для воркера: кому напомнить сейчас. День — по часовому поясу подписки.
create or replace function public.due_reminders(p_now timestamptz default now())
returns table (endpoint text, p256dh text, auth text, lang text)
language sql stable security definer set search_path = '' as $$
  select s.endpoint, s.p256dh, s.auth, s.lang
  from public.push_subscriptions s
  left join public.student_progress p on p.profile_id = s.profile_id
  cross join lateral (select (p_now at time zone s.tz)::date as local_day) d
  where extract(hour from (p_now at time zone s.tz)) = s.remind_hour
    and (s.last_sent_on is null or s.last_sent_on < d.local_day)
    and not (coalesce(p.data -> 'math-tasks:activity', '{}'::jsonb) ? to_char(d.local_day, 'YYYY-MM-DD'))
    and not (coalesce(p.data -> 'math-tasks:trainer-days', '{}'::jsonb) ? to_char(d.local_day, 'YYYY-MM-DD'))
  -- Воркер за запуск отправляет не все (лимит запросов тарифа): первыми — кому напоминали давнее всего.
  order by s.last_sent_on asc nulls first, s.created_at
  limit 2000
$$;

-- Для воркера: отметить отправленные, посчитать сбои, убрать исчезнувшие.
create or replace function public.mark_reminders(p_now timestamptz, p_sent text[], p_failed text[], p_gone text[])
returns void language plpgsql security definer set search_path = '' as $$
begin
  update public.push_subscriptions s set last_sent_on = (p_now at time zone s.tz)::date, failures = 0
    where s.endpoint = any(coalesce(p_sent, '{}'));
  update public.push_subscriptions set failures = failures + 1 where endpoint = any(coalesce(p_failed, '{}'));
  -- 404/410 — подписки больше нет; пять сбоев подряд — сервис её не принимает.
  delete from public.push_subscriptions where endpoint = any(coalesce(p_gone, '{}')) or failures >= 5;
end;
$$;

revoke all on function public.save_push_subscription(text, text, text, text, int, text), public.delete_push_subscription(text),
  public.my_push_reminder(text), public.due_reminders(timestamptz), public.mark_reminders(timestamptz, text[], text[], text[])
  from public, anon, authenticated;
grant execute on function public.save_push_subscription(text, text, text, text, int, text), public.delete_push_subscription(text),
  public.my_push_reminder(text) to authenticated;
grant execute on function public.due_reminders(timestamptz), public.mark_reminders(timestamptz, text[], text[], text[]) to service_role;
