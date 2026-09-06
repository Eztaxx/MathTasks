-- Миграция 010: Кросс-теги для классификации задач на стыке тем (VISC/Skola2030)
-- Словарь закрытый, 23 тега. У задачи связка с тегами через task_tags.
-- Запускать в Supabase: SQL Editor -> New query -> Run

-- 1. Таблица тегов
create table if not exists public.tags (
  id bigint generated always as identity primary key,
  slug text not null unique,
  title text not null,
  title_lv text not null,
  description text,
  position int not null default 0,
  created_at timestamptz not null default now()
);

-- 2. Связующая таблица задача <-> тег
create table if not exists public.task_tags (
  task_id bigint not null references public.tasks(id) on delete cascade,
  tag_id bigint not null references public.tags(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (task_id, tag_id)
);

create index if not exists idx_task_tags_tag on public.task_tags(tag_id);
create index if not exists idx_task_tags_task on public.task_tags(task_id);

-- 3. Row Level Security
alter table public.tags enable row level security;
alter table public.task_tags enable row level security;

drop policy if exists "Tags are viewable by everyone" on public.tags;
create policy "Tags are viewable by everyone" on public.tags for select using (true);

drop policy if exists "Admins can manage tags" on public.tags;
create policy "Admins can manage tags" on public.tags for all using (public.is_admin());

drop policy if exists "Task tags are viewable by everyone" on public.task_tags;
create policy "Task tags are viewable by everyone" on public.task_tags for select using (true);

drop policy if exists "Admins can manage task tags" on public.task_tags;
create policy "Admins can manage task tags" on public.task_tags for all using (public.is_admin());

-- 4. Заполнение закрытого словаря (23 тега стандарта Skola2030)
insert into public.tags (slug, title, title_lv, description, position)
values
  ('algebriskie-parveidojumi', 'Алгебраические преобразования', 'Algebriskie pārveidojumi', 'Тождественные преобразования выражений, формулы сокращённого умножения', 1),
  ('vienadojumi', 'Уравнения', 'Vienādojumi', 'Уравнения всех типов и их системы', 2),
  ('nevienadibas', 'Неравенства', 'Nevienādības', 'Неравенства всех типов и их системы', 3),
  ('funkcijas', 'Функции', 'Funkcijas', 'Функции, их свойства, область определения и значений', 4),
  ('grafiki', 'Графики', 'Grafiki', 'Построение и чтение графиков функций', 5),
  ('koordinatu-metode', 'Координатный метод', 'Koordinātu metode', 'Координатная прямая, плоскость, векторы в координатах', 6),
  ('vektori', 'Векторы', 'Vektori', 'Действия с векторами, скалярное произведение', 7),
  ('trigonometrija', 'Тригонометрия', 'Trigonometrija', 'Тригонометрические функции, тождества, уравнения и треугольники', 8),
  ('planimetrija', 'Планиметрия', 'Planimetrija', 'Фигуры на плоскости, углы, подобие, теорема Пифагора', 9),
  ('stereometrija', 'Стереометрия', 'Stereometrija', 'Пространственные тела, сечения, призмы, пирамиды, тела вращения', 10),
  ('merijumi', 'Измерения', 'Mērījumi', 'Длины, периметры, площади, объёмы и единицы измерения', 11),
  ('dalas-procenti', 'Дроби и проценты', 'Daļas un procenti', 'Обыкновенные и десятичные дроби, проценты, пропорции', 12),
  ('dalamiba', 'Делимость', 'Dalāmība', 'Простые числа, признаки делимости, НОД (LKD) и НОК (MKD)', 13),
  ('pakapes-saknes', 'Степени и корни', 'Pakāpes un saknes', 'Действия со степенями, свойства арифметических корней', 14),
  ('logaritmi', 'Логарифмы', 'Logaritmi', 'Свойства логарифмов, логарифмические уравнения и неравенства', 15),
  ('virknes', 'Последовательности', 'Virknes', 'Числовые последовательности, арифметическая и геометрическая прогрессии', 16),
  ('kombinatorika', 'Комбинаторика', 'Kombinatorika', 'Правила суммы и произведения, перестановки, размещения, сочетания', 17),
  ('varbutiba', 'Вероятность', 'Varbūtība', 'Классическая и геометрическая вероятность, независимые события', 18),
  ('statistika', 'Статистика', 'Statistika', 'Среднее, медиана, мода, размах, диаграммы и анализ данных', 19),
  ('matematiska-analize', 'Математический анализ', 'Matemātiskā analīze', 'Пределы, производная, исследование функций, интеграл и площади', 20),
  ('modelesana', 'Моделирование', 'Modelēšana', 'Математическое моделирование реальных процессов', 21),
  ('teksta-uzdevumi', 'Текстовые задачи', 'Teksta uzdevumi', 'Сюжетные задачи на движение, работу, смеси, покупки', 22),
  ('pieradijumi', 'Доказательства', 'Pierādījumi', 'Геометрические и алгебраические доказательства, метод индукции', 23)
on conflict (slug) do update set
  title = excluded.title,
  title_lv = excluded.title_lv,
  description = excluded.description,
  position = excluded.position;
