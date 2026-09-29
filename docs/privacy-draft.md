# Черновик страницы «Конфиденциальность» / «Privātuma politika»

Черновик не опубликован и на сайт не подключён. Составлен по коду и миграциям
(027 — профили, 028 — дуэли, 023 — сообщения об ошибках); всё, что не
удалось узнать из кода, отмечено **[ЗАПОЛНИТЬ]**. Перед публикацией текст
стоит показать юристу: я проверил факты, а не формулировки закона.

## Что нужно вписать до публикации

- **Оператор** — имя или название, адрес, электронная почта для обращений
  (публично; адрес администратора из кода я не подставлял).
- **Регион базы Supabase** (ЕС или нет) — в панели проекта, Settings → General.
- **Аналитика Cloudflare** — включена ли Web Analytics в панели Cloudflare.
  В политике безопасности сайта адрес её скрипта разрешён; в разметке я его не нашёл.
- **Срок хранения профилей.** Очистка неактивных профилей описана в конце
  миграции 027, но по расписанию не включена. В тексте я написал только то,
  что действует сейчас.

## Находка, которую надо решить до публикации

Кнопка «Удалить профиль» (`delete_my_profile`) удаляет профиль, прогресс и
привязку устройств, но **строки `duel_runs` остаются**: ник, зверь, ответы и
время попыток. Либо стоит чистить их вместе с профилем (миграция 034), либо
оставить, как в тексте ниже («результаты дуэлей остаются в таблице лидеров, пока
вы не попросите удалить их по почте»).

---

## Русский

### Конфиденциальность

Сайт MathTasks — сборник школьных задач по математике. Мы собираем как можно
меньше данных: имя, почта, телефон и дата рождения нам не нужны и не
запрашиваются.

**Кто отвечает за данные.** [ЗАПОЛНИТЬ: имя или название оператора, адрес,
почта для обращений.]

**Что остаётся только в вашем браузере.** Решённые задачи, избранное, выбранные
класс, язык и тема оформления, режим просмотра, звук, ник для дуэлей. Эти данные
хранятся в локальной памяти браузера (`localStorage`) и на наш сервер не
отправляются, пока вы не создадите профиль. Очистите данные сайта в браузере —
и они исчезнут. Рекламных и отслеживающих cookie на сайте нет.

**Профиль (по желанию).** Если вы создаёте профиль, чтобы прогресс переходил
между устройствами, мы храним:
- ник, который вы выбрали (пожалуйста, не используйте настоящее имя), и зверя-аватар;
- прогресс: решённые задачи, избранное, значки, статистику дуэлей;
- дату создания профиля и последнего визита;
- хеш кода восстановления (сам код у нас не хранится) и анонимный идентификатор
  устройства. Вход анонимный — без почты и пароля.

Профиль можно удалить в любой момент кнопкой «Удалить профиль» на странице
«Мой прогресс»: профиль, прогресс и привязка устройств будут удалены.

**Дуэли.** Для дуэли и таблицы лидеров мы храним ник, зверя, случайный
идентификатор игрока в браузере, ваши ответы, время ответов и результат.
Таблица лидеров показывает ник и зверя. Результаты дуэлей остаются в таблице,
пока вы не попросите их удалить письмом на адрес выше.

**Сообщения об ошибках.** Кнопка «Нашли ошибку?» отправляет номер задачи, тип
ошибки, ваш текст (до 1000 знаков), введённый вами ответ, число неверных попыток
и язык интерфейса. Личных данных в форме нет — не пишите их в тексте. Сообщение
видит администратор сайта; копия текста приходит ему в Telegram.

**Зачем.** Чтобы сайт работал, переносил прогресс между устройствами, вёл
таблицу лидеров и чтобы мы исправляли ошибки в задачах. Данные не продаются,
не используются для рекламы и не передаются третьим лицам в маркетинговых целях.

**Кто технически обрабатывает данные.**
- Supabase — база данных и хранилище (регион: [ЗАПОЛНИТЬ]).
- Cloudflare — хостинг и доставка сайта; получает IP-адрес и технические
  журналы обращений к сайту. [ЗАПОЛНИТЬ, если включена Web Analytics: сайт
  использует обезличенную статистику посещений Cloudflare.]
- jsDelivr (библиотеки KaTeX и Supabase) и Google Fonts (шрифты) — при загрузке
  страницы получают ваш IP-адрес и сведения о браузере, как любой сайт.
- Telegram — уведомления администратору о сообщениях об ошибках.

**Ваши права.** Вы можете запросить доступ к своим данным, исправление,
удаление, ограничение обработки, возразить против обработки. Напишите нам на
адрес выше. Если считаете, что мы нарушаем закон, вы вправе обратиться в
Datu valsts inspekcija (dvi.gov.lv).

**Дети.** Сайт рассчитан на школьников. Профиль создавайте сами, если вам не
меньше 13 лет; младшим детям профиль создаёт родитель или учитель. Мы ничего не
знаем о возрасте пользователя — у нас нет ни даты рождения, ни имени.

**Изменения.** Если что-то в обработке данных изменится, мы обновим эту страницу
и дату ниже. Последнее обновление: [ЗАПОЛНИТЬ: дата публикации].

---

## Latviešu

### Privātuma politika

MathTasks ir skolas matemātikas uzdevumu krājums. Mēs vācam pēc iespējas
mazāk datu: vārds, e-pasts, tālrunis un dzimšanas datums mums nav vajadzīgi un
netiek prasīti.

**Kas atbild par datiem.** [JĀAIZPILDA: pārziņa vārds vai nosaukums, adrese,
e-pasts pieprasījumiem.]

**Kas paliek tikai jūsu pārlūkā.** Atrisinātie uzdevumi, izlase, izvēlētā klase,
valoda un tēma, skata režīms, skaņa, iesauka dueļiem. Šie dati glabājas
pārlūka lokālajā atmiņā (`localStorage`) un netiek sūtīti uz mūsu serveri, kamēr
neesat izveidojis profilu. Notīriet vietnes datus pārlūkā — un tie pazudīs.
Reklāmas un izsekošanas sīkdatņu vietnē nav.

**Profils (pēc izvēles).** Ja izveidojat profilu, lai progress pārietu starp
ierīcēm, mēs glabājam:
- jūsu izvēlēto iesauku (lūdzu, nelietojiet īsto vārdu) un dzīvnieka avatāru;
- progresu: atrisinātos uzdevumus, izlasi, nozīmītes, dueļu statistiku;
- profila izveides un pēdējā apmeklējuma datumu;
- atjaunošanas koda jaucējkodu (pašu kodu mēs nekur nesaglabājam) un anonīmu
  ierīces identifikatoru. Pieteikšanās ir anonīma — bez e-pasta un paroles.

Profilu var dzēst jebkurā brīdī ar pogu «Dzēst profilu» lapā «Mans progress»:
profils, progress un ierīču piesaiste tiks dzēsti.

**Dueļi.** Duelim un līderu tabulai mēs glabājam iesauku, dzīvnieku, nejaušu
spēlētāja identifikatoru pārlūkā, jūsu atbildes, atbilžu laiku un rezultātu.
Līderu tabulā redzama iesauka un dzīvnieks. Dueļu rezultāti tabulā paliek, kamēr
neatsūtāt pieprasījumu tos dzēst uz augstāk norādīto adresi.

**Ziņojumi par kļūdām.** Poga «Atradāt kļūdu?» nosūta uzdevuma numuru, kļūdas
veidu, jūsu tekstu (līdz 1000 rakstzīmēm), jūsu ievadīto atbildi, nepareizo
mēģinājumu skaitu un saskarnes valodu. Personas datu veidlapā nav — nerakstiet
tos tekstā. Ziņojumu redz vietnes administrators; teksta kopija viņam pienāk
Telegram.

**Kāpēc.** Lai vietne darbotos, pārnestu progresu starp ierīcēm, uzturētu
līderu tabulu un lai mēs labotu kļūdas uzdevumos. Dati netiek pārdoti, netiek
izmantoti reklāmai un netiek nodoti trešajām personām mārketinga nolūkos.

**Kas tehniski apstrādā datus.**
- Supabase — datubāze un krātuve (reģions: [JĀAIZPILDA]).
- Cloudflare — vietnes mitināšana un piegāde; saņem IP adresi un tehniskos
  piekļuves žurnālus. [JĀAIZPILDA, ja ieslēgta Web Analytics: vietne izmanto
  Cloudflare anonimizētu apmeklējumu statistiku.]
- jsDelivr (KaTeX un Supabase bibliotēkas) un Google Fonts (fonti) — lapas
  ielādes laikā saņem jūsu IP adresi un informāciju par pārlūku, kā jebkura vietne.
- Telegram — paziņojumi administratoram par ziņojumiem par kļūdām.

**Jūsu tiesības.** Jūs varat pieprasīt piekļuvi saviem datiem, to labošanu,
dzēšanu, apstrādes ierobežošanu, iebilst pret apstrādi. Rakstiet uz augstāk
norādīto adresi. Ja uzskatāt, ka mēs pārkāpjam likumu, varat vērsties Datu valsts
inspekcijā (dvi.gov.lv).

**Bērni.** Vietne domāta skolēniem. Profilu izveidojiet paši, ja esat vismaz
13 gadus veci; jaunākiem bērniem profilu izveido vecāks vai skolotājs. Mēs
neko nezinām par lietotāja vecumu — mums nav ne dzimšanas datuma, ne vārda.

**Izmaiņas.** Ja datu apstrādē kaut kas mainīsies, mēs atjaunosim šo lapu un
zemāk norādīto datumu. Pēdējais atjauninājums: [JĀAIZPILDA: publicēšanas datums].
