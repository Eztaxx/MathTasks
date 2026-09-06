-- Миграция 015: латышские описания кросс-тегов
-- У таблицы tags были title и title_lv, но описание — только одно.
-- На латышской версии сайта под заголовком тега показывался русский текст.
-- Запускать в Supabase: SQL Editor -> New query -> Run

alter table public.tags add column if not exists description_lv text;

update public.tags set description_lv = case slug
  when 'algebriskie-parveidojumi' then 'Izteiksmju identiski pārveidojumi, saīsinātās reizināšanas formulas'
  when 'vienadojumi'              then 'Visu veidu vienādojumi un to sistēmas'
  when 'nevienadibas'             then 'Visu veidu nevienādības un to sistēmas'
  when 'funkcijas'                then 'Funkcijas, to īpašības, definīcijas un vērtību kopa'
  when 'grafiki'                  then 'Funkciju grafiku veidošana un lasīšana'
  when 'koordinatu-metode'        then 'Koordinātu taisne un plakne, vektori koordinātās'
  when 'vektori'                  then 'Darbības ar vektoriem, skalārais reizinājums'
  when 'trigonometrija'           then 'Trigonometriskās funkcijas, identitātes, vienādojumi un trijstūri'
  when 'planimetrija'             then 'Figūras plaknē, leņķi, līdzība, Pitagora teorēma'
  when 'stereometrija'            then 'Telpiski ķermeņi, šķēlumi, prizmas, piramīdas, rotācijas ķermeņi'
  when 'merijumi'                 then 'Garumi, perimetri, laukumi, tilpumi un mērvienības'
  when 'dalas-procenti'           then 'Parastās un decimāldaļas, procenti, proporcijas'
  when 'dalamiba'                 then 'Pirmskaitļi, dalāmības pazīmes, LKD un MKD'
  when 'pakapes-saknes'           then 'Darbības ar pakāpēm, aritmētisko sakņu īpašības'
  when 'logaritmi'                then 'Logaritmu īpašības, logaritmiskie vienādojumi un nevienādības'
  when 'virknes'                  then 'Skaitļu virknes, aritmētiskā un ģeometriskā progresija'
  when 'kombinatorika'            then 'Summas un reizinājuma likumi, permutācijas, variācijas, kombinācijas'
  when 'varbutiba'                then 'Klasiskā un ģeometriskā varbūtība, neatkarīgi notikumi'
  when 'statistika'               then 'Vidējais, mediāna, moda, amplitūda, diagrammas un datu analīze'
  when 'matematiska-analize'      then 'Robežas, atvasinājums, funkciju pētīšana, integrālis un laukumi'
  when 'modelesana'               then 'Reālu procesu matemātiskā modelēšana'
  when 'teksta-uzdevumi'          then 'Sižeta uzdevumi par kustību, darbu, maisījumiem, pirkumiem'
  when 'pieradijumi'              then 'Ģeometriski un algebriski pierādījumi, indukcijas metode'
  else description_lv
end;
