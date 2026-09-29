# Folio — Owner's Manual

_Обновлено: 2026-09-29 (языки RU/KZ, левая панель, новая модель оценки, B2B-приглашения, Stripe confirm, безопасность)._

Folio — платформа приёмных портфолио: студенты собирают Common App-style
портфолио с честным AI-фидбеком и реальными шансами, школы и консультанты
ведут когорты в отдельном Business Workspace. Прод: **https://foli0.vercel.app**

---

## 0. Обновление 2026-09-29 — что изменилось

**Языки (EN / RU / KZ).** Переключатель в левой панели, в шапке сайта и в
«Настройках». Язык хранится в cookie `folio_lang`, сервер отдаёт только нужный
словарь. Ключи — сами английские строки: `t('Your portfolio')`. Словари —
`lib/locales/{ru,kk}.js`. Проверка полноты: `npm run i18n:check` (упадёт, если
где-то появилась строка без перевода или сломан плейсхолдер). AI-ответы (разбор,
эссе-коуч, консультант) приходят на выбранном языке; переписанные описания
активностей остаются на английском (заявки подаются на английском).
Данные вузов/олимпиад (описания) пока на английском.

**Левая панель.** Приложение живёт в группе `app/(app)` с сайдбаром
(`components/AppShell.js`), на телефоне — выезжающее меню. Бывшая правая колонка
портфолио разнесена по разделам: `/review` (оценка + AI-разбор), `/essay`,
`/advisor`, `/deadlines`, `/share`, `/settings`. Маркетинг — `app/(site)`.

**Оценка стала объективной** (`lib/profile.js`, `lib/chances.js`):
- SAT считается по перцентильной кривой: 1200 → 30/100, 1550 → 93/100, и
  больше не «усредняется» с IELTS;
- каждая активность оценивается по рубрике (роль, масштаб, измеримый
  результат, достижения, часы) → Tier 1–4; в столп идут лучшие активности
  с убывающим весом (10 слабых не бьют 3 сильные);
- AI-разбор дополнительно оценивает каждую активность (±25 от рубрики, чтобы
  модель не завышала), оценка привязана к тексту и устаревает при правке;
- шансы: активности сравниваются с планкой конкретного вуза (Гарвард ждёт
  национальный уровень, вуз с 50% — нет).

**B2B.** «Добавить учеников» — вставить список email (или раздать код).
Ученик видит баннер-приглашение при входе и подтверждает сам. Неоплаченное
пространство = пробный режим на 3 ученика (без Pro для них). После онбординга
школа попадает сразу в «Ученики», а не на оплату.

**Stripe.** Добавлены `/api/billing/confirm` (Pro включается сразу по
возвращении с оплаты, не дожидаясь webhook), статус подписки (продление,
отмена в конце периода, неудачный платёж) в «Настройках», защита от отзыва
новой подписки старым событием, скрипт `npm run stripe:setup`.

**Безопасность.** CSP/HSTS/X-Frame-Options и др. в `next.config.mjs`; GA не
грузится без согласия (баннер cookie), URL в аналитике обезличены; страницы
`/privacy` и `/terms`; экспорт и удаление данных в «Настройках»; лимиты длины
на все AI-входы; cron закрыт без `CRON_SECRET`; в правилах — только владелец
может создавать коды приглашения, поля подписки защищены.

**SEO.** У каждой страницы свой title/description на языке пользователя,
OG-картинка, приватные разделы закрыты от индексации, `/universities` и
`/discover` открыты. Своя 404 и страница ошибки.

### Ручные шаги (я их сделать не могу)
1. **Опубликовать `firestore.rules`** в Firebase Console → Firestore → Rules
   (без этого не заработают приглашения по email).
2. **Stripe**: важно — Stripe не принимает компании из Казахстана; нужен
   аккаунт на юрлицо в поддерживаемой стране (например, US LLC через Stripe
   Atlas). Затем:
   `STRIPE_SECRET_KEY=sk_test_… SITE_URL=https://foli0.vercel.app npm run stripe:setup`
   — скрипт создаст цены, webhook и портал и напечатает env-переменные.
   Добавить их + `FIREBASE_SERVICE_ACCOUNT_JSON` в Vercel и сделать `./deploy.sh`.
3. Для будущих напоминаний: `CRON_SECRET` в Vercel.

---

## 1. Архитектура

- **Next.js 16 (App Router, JS, без Tailwind)** — деплой на Vercel (`deploy.sh`).
- **Firebase Auth (Google) + Firestore** — без env-ключей приложение деградирует
  в localStorage-режим (портфолио работает, аккаунтов/B2B нет).
- **AI-цепочка** `lib/ai.js`: **Groq → OpenRouter → Gemini** (пустые ключи
  пропускаются; Gemini держать последним — AQ-ключи аккаунта ограничены).
- **Биллинг: Stripe** (подписки) — checkout, портал, webhook; планы в Firestore
  переключаются автоматически. Без Stripe-env всё деградирует в «напишите нам».
- **Server-side без Admin SDK**: `lib/plan-server.js` (проверка idToken +
  чтение планов как-пользователь), `lib/firestore-admin.js` (JWT сервис-аккаунта
  через node:crypto → Firestore REST, только для webhook).

### Роли и планы

| Сущность | Поле | Значения |
|---|---|---|
| `users/{uid}` | `plan` | `free` \| `pro` |
| `users/{uid}` | `role` | `student` \| `counselor` \| `orgAdmin` |
| `users/{uid}` | `founder` | `true` у основателя (авто) |
| `orgs/{orgId}` | `plan` | `free` (setup, до 3 студентов) \| `business` (20) \| `businessPlus` (75) |

Эффективный план студента: свой `pro` **или** Pro-по-наследству, пока он
подключён к оплаченному workspace (`lib/plans.js → effectiveStudentPlan`).

### Цены (`lib/plans.js` — единственный источник правды)

- Student: **Free $0**, **Pro $9/мес**
- Workspace: **Business $149/мес (до 20 студентов)**, **Business Plus $299/мес (до 75)**
- Free Pilot и Enterprise удалены. Неоплаченный workspace = режим настройки
  (до 3 студентов, чтобы попробовать процесс до оплаты).

### Основатель (авто-грант)

`djdjdj.9413@gmail.com` захардкожен в `lib/plans.js → FOUNDER_EMAILS` и в
`firestore.rules → isFounder()`. При первом входе аккаунт автоматически
получает `plan: pro`, `founder: true` и workspace **Folio HQ** на плане
Business (`lib/account.js → ensureFounderGrant`). Ничего руками делать не надо.
`FOLIO_ADMIN_EMAILS` (env) может расширить список — тогда добавь тот же email
и в rules.

---

## 2. Маршруты

**Публичные:** `/` (лендинг: #product #schools #pricing #faq), `/start`
(онбординг: студент/бизнес), `/login`, `/upgrade` (тарифы + checkout),
`/p/{shareId}` (публичное портфолио), `/join/{CODE}`, robots.txt, sitemap.xml.

**Студент:** `/portfolio` (билдер), `/portfolio/print` (PDF), `/universities`,
`/discover`. Лендинг сознательно НЕ ссылается на /universities и /discover —
воронка идёт через /start.

**Business Workspace `/business`** (staff: counselor/orgAdmin):
- `/business` — Overview: KPI, «needs attention», deadline radar, чек-лист настройки
- `/business/students` — ростер: поиск, сортировки, флаги, next steps, CSV (платно)
- `/business/counselors` — команда + mentor-код, удаление
- `/business/analytics` — распределение силы, частые пробелы, grade mix, engagement
- `/business/billing` — подписка: checkout / Stripe portal
- `/business/settings` — имя, тип, white-label brand (платно), коды
- `/counselor/student/{uid}` — карточка студента (осталась)
- `/counselor` и `/admin` — legacy-редиректы на `/business`

**Founder:** `/admin/orgs` — консоль: ручные планы (Free/Business/Plus/seats),
grant Pro по email. Нужна на случай Kaspi-оплат и саппорта.

**API:** `/api/enhance`, `/api/feedback` (free AI), `/api/essay`,
`/api/counselor` (premium, серверный гейт планов), `/api/billing/checkout`,
`/api/billing/portal`, `/api/webhooks/billing` (Stripe), `/api/admin/me`,
`/api/cron/reminders`.

---

## 3. Биллинг (Stripe) — как включить

1. **Stripe → Products**: создай 3 recurring-цены — Pro $9/mo, Business
   $149/mo, Business Plus $299/mo. Скопируй `price_…` id.
2. **Webhook**: Developers → Webhooks → Add endpoint
   `https://foli0.vercel.app/api/webhooks/billing`, события:
   `checkout.session.completed`, `customer.subscription.updated`,
   `customer.subscription.deleted`, `invoice.payment_failed`. Скопируй `whsec_…`.
3. **Billing Portal**: Settings → Billing → Customer portal → включи смену
   плана между Business и Business Plus, отмену и инвойсы.
4. **Firebase сервис-аккаунт**: Console → Project settings → Service accounts →
   Generate key → JSON в одну строку.
5. **Env на Vercel** (`vercel env add … production`, потом `./deploy.sh`):
   `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_PRO`,
   `STRIPE_PRICE_BUSINESS`, `STRIPE_PRICE_BUSINESS_PLUS`,
   `FIREBASE_SERVICE_ACCOUNT_JSON`, `NEXT_PUBLIC_SITE_URL=https://foli0.vercel.app`.

### Как это работает

- `/api/billing/checkout` создаёт Checkout Session с `uid` и `plan` в metadata
  (session + subscription) — матчинг оплаты точный, не по email.
- Webhook: grant/revoke планов. **Business/Plus**: обновляет org владельца, а
  если org нет — **создаёт workspace автоматически** (org + membership + оба
  invite-кода + back-link на users), покупатель после оплаты попадает в готовый
  `/business?welcome=1`. **Pro**: `users/{uid}.plan`.
- Upgrade/downgrade Business↔Plus — через Stripe Portal (proration), webhook
  ловит `customer.subscription.updated` по price id. Cancel → `plan: free`.
- Кэш планов на сервере — 60 сек: после оплаты доступ включается в течение минуты.
- Оплаты «мимо» (не тем email, без аккаунта) попадают в `billing_events`
  со статусом `unmatched` — активируй руками в `/admin/orgs`.
- Без Stripe-env: API отвечает 501, UI показывает concierge-фоллбек
  (mailto hello@folio.app, Kaspi).

---

## 4. Firestore Rules — ОБЯЗАТЕЛЬНО ПЕРЕОПУБЛИКОВАТЬ

`firestore.rules` изменён (новые защиты) → Firebase Console → Firestore →
Rules → вставить целиком → **Publish**. Без этого B2B и биллинг-поля
работают неправильно.

Что enforced:
- `plan` на users/orgs клиент не пишет никогда (создание только `free`);
  планы меняют webhook (сервис-аккаунт) и founder.
- **Биллинг-поля** (`stripeCustomerId`, `stripeSubscriptionId`,
  `planUpdatedAt`, `founder`) клиенту недоступны на запись — иначе можно было
  бы открыть чужой billing-portal.
- Роли: staff-роль должна подтверждаться реальным membership (getAfter).
- orgAdmin может менять только `name`, `type`, `brandName`.
- Shares: угон share-id невозможен (ownerUid не переносится).
- `billing_events` — читает только founder, пишет только сервер.

---

## 5. ENV — полный список

| Переменная | Что | Обязательно |
|---|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY/AUTH_DOMAIN/PROJECT_ID/APP_ID` | Firebase web app | для аккаунтов/B2B |
| `GROQ_API_KEY` | основной AI | хотя бы один AI-ключ |
| `OPENROUTER_API_KEY`, `GEMINI_API_KEY(S)` | фоллбеки AI | нет |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | биллинг | для онлайн-оплат |
| `STRIPE_PRICE_PRO/_BUSINESS/_BUSINESS_PLUS` | цены | для онлайн-оплат |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | webhook пишет планы | для онлайн-оплат |
| `NEXT_PUBLIC_SITE_URL` | канонический URL (Stripe redirect, OG, sitemap) | желательно |
| `FOLIO_ADMIN_EMAILS` | доп. админы (основатель уже в коде) | нет |
| `NEXT_PUBLIC_GA_ID` | GA4 | нет |
| `UPSTASH_REDIS_REST_URL/TOKEN` | глобальный rate-limit | нет |

Прод-env руками: `vercel env add NAME production` → `./deploy.sh`
(алиас foli0.vercel.app перепривязывается скриптом).

---

## 6. Что изменилось в этом релизе

1. **Лендинг переработан полностью**: центральный hero с градиентным
   заголовком и продукт-мокапом, marquee университетов, bento-грид продукта,
   секция «no-glaze», Business-секция, новый pricing, тёмный CTA. Прямых ссылок
   на Discover/Universities на лендинге больше нет (воронка — /start), у nav на
   лендинге якоря Product / For schools / Pricing.
2. **Pricing**: переключатель аудиторий, 2 карточки на аудиторию, градиентная
   рамка featured-плана. Планы: Free / Pro $9; Business $149 (20) /
   Business Plus $299 (75). Free Pilot и Enterprise удалены.
3. **Stripe end-to-end**: checkout, портал, webhook (grant/revoke/switch),
   автосоздание workspace после покупки, авто-Pro всем студентам оплаченных
   workspace, деградация без env.
4. **Business Workspace** `/business` c 6 разделами (см. §2), auto-redirect из
   `/counselor` и `/admin`. B2B-ценность: cohort analytics, engagement,
   deadline radar по всей когорте, CSV, white-label `brandName`, чек-лист
   онбординга.
5. **Founder auto-grant** — кодом, без ручных правок Firestore.
6. **Безопасность**: биллинг-поля закрыты в rules; webhook проверяет подпись
   Stripe с 5-минутным окном против replay; серверный кэш планов 60 сек.
7. **SEO/полировка**: metadataBase + OG, robots.txt, sitemap.xml, страница 404,
   theme-color; удалён мёртвый код (Lemon Squeezy-ветка, hosted-checkout URLs,
   старый org-admin дашборд).

## 7. Регулярные операции

- **Продажа руками (Kaspi)**: `/admin/orgs` → Business/Plus/seats или Grant Pro.
- **Смена цен**: `lib/plans.js` (+ новые Price в Stripe + env).
- **Новый founder-email**: `lib/plans.js FOUNDER_EMAILS` + `firestore.rules
  isFounder()` + publish rules.
- **Мониторинг оплат**: коллекция `billing_events` (applied / unmatched /
  payment_failed) — читается под founder-аккаунтом.
- **AI сломался на проде, локально работает**: `vercel env ls production` и
  `vercel alias ls | grep foli0`.

## 8. Известные ограничения (осознанные)

- Email/Telegram-доставка дедлайн-напоминаний — заготовка (`/api/cron/reminders`),
  in-app бейджи работают.
- Лимит counselor-мест не enforced в rules (soft, в UI-копии Plus «unlimited»).
- `/counselor/student/{uid}` остался в старом визуальном стиле воркспейса —
  функционален, редизайн по желанию.
- Rate-limit в памяти на инстанс, пока не подключён Upstash.
