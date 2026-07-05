# Отчёт по большому апгрейду Folio (бриф FABLE_BRIEF.md)

Дата: 2026-07-05. Все разделы брифа A–K + I выполнены (детали и оговорки ниже).
`npm run build` — чисто; localStorage-only режим (без Firebase env) работает как раньше.

---

## Clean-pass (второй проход, 2026-07-05)

**Security-фиксы в `firestore.rules` — ОБЯЗАТЕЛЬНО перепубликуй правила:**
- `shares`: закрыта дыра перехвата — раньше любой залогиненный мог перезаписать чужую share-ссылку, подставив свой `ownerUid`. Теперь update разрешён только владельцу и владельца менять нельзя.
- `users`: закрыта самоэскалация роли — `role: counselor/orgAdmin` можно записать себе только если в том же батче существует реальное членство с той же ролью (`getAfter`). Обычные клиентские флоу (создание орга, вступление по коду) работают как раньше.
- `orgs`: org-админ теперь может менять только `name`/`type` (раньше — всё, кроме plan/seats/owner, включая инвайт-коды).
- `portfolios`: стафф орга может **отвязать** удалённого ученика (обнулить orgId/orgName/counselorId — и ничего больше), чтобы UI ученика не показывал «connected» после удаления из ростера.
- Новая коллекция `billing_events` (аудит платежей): пишет только вебхук через service account, читает founder.

**Логика:**
- `leaveOrg` сбрасывает `role → student` (раньше «призрачный» counselor оставался в навигации).
- `removeMember` сначала отвязывает портфолио, потом удаляет членство.
- Nav показывает «Dashboard» только при роли **и** реальном orgId.
- `/portfolio` больше не выбрасывает залогиненного юзера в онбординг, пока облачная копия не загрузилась (новый флаг `synced` в `usePortfolio`).
- `/upgrade` знает про Business-план орга (использует `useEffectivePlan`).
- `Reveal` (scroll-анимации лендинга) получил failsafe: если IntersectionObserver не сработал (headless/встроенные браузеры), контент всё равно показывается — раньше секции могли остаться невидимыми.

**Онбординг `/start` — развилка аудитории:**
- Первый вопрос: «студент или школа/консультант?» (диплинк `/start?type=business`).
- Бизнес-ветка: имя воркспейса + тип → размер когорты → цели → Google-вход → воркспейс создан → `/counselor`. Ответы (`size`, `goals`) сохраняются на орг-доке — видно интент при продаже Business.
- Студенческая ветка — прежний опросник.

**Платежи — онлайн-чекаут готов (см. раздел «Как включить платежи»).**

**Лендинг:** полоса цифр (реальные счётчики университетов/возможностей), новые иконки фич, FAQ, многоколоночный футер, CTA для школ ведут в `/start?type=business`; убраны «placeholder»-подписи из цен.

### Как включить платежи (онлайн, автоактивация)

1. Заведи продукт(ы) у провайдера с hosted-checkout: **Lemon Squeezy** (проще всего, работает с КЗ) или Stripe Payment Link / Paddle / Polar.
2. Vercel env:
   - `NEXT_PUBLIC_CHECKOUT_PRO_URL` — ссылка чекаута Pro ($9/mo);
   - `NEXT_PUBLIC_CHECKOUT_BUSINESS_URL` — ссылка чекаута Business (опц.);
   - `FIREBASE_SERVICE_ACCOUNT_JSON` — JSON сервисного аккаунта одной строкой (Firebase Console → Project settings → Service accounts → Generate new private key);
   - `LEMONSQUEEZY_WEBHOOK_SECRET` (или `STRIPE_WEBHOOK_SECRET`).
3. У провайдера добавь вебхук → `https://foli0.vercel.app/api/webhooks/billing`, события: `order_created`, `subscription_created/resumed/unpaused/expired` (LS) или `checkout.session.completed` (Stripe).
4. Готово: `/upgrade` начнёт открывать чекаут с предзаполненным email; после оплаты вебхук находит юзера по email и ставит `plan: pro` (Business — флипает орг покупателя). Несматченные оплаты попадают в `billing_events` со статусом `unmatched` — активируешь руками в `/admin/orgs`.
5. Пока env не заданы — `/upgrade` показывает прежний ручной флоу (mailto + Kaspi), ничего не ломается.

---

## Что сделано (по разделам брифа)

**A. Хардненинг**
- A1 (rate-limit) был готов; лимиты теперь план-зависимые (`lib/plans.js → AI_LIMITS`) и ключуются по uid для залогиненных (по IP для анонимов). Лимит 0 = фича выключена.
- A2: `lib/store.js` — Firestore-first при логине: живая подписка (onSnapshot), облако = источник истины, localStorage = кэш; записи `merge:true` (линк-поля не затираются); миграция локальных данных в пустое облако и guard от затирания сохранены.

**J. Тарифы и гейтинг**
- `lib/plans.js` — единственный источник правды: 3 плана, фичефлаги, лимиты, цены-плейсхолдеры ($0 / $9 / от $6 за место — **поменяй перед запуском в одном файле**).
- Серверная проверка планов **без Admin SDK**: клиент шлёт Firebase ID-токен → `lib/plan-server.js` верифицирует его через Identity Toolkit REST и читает `users/{uid}` / `orgs/{orgId}` через Firestore REST **от имени пользователя** (правила применяются). Fail-closed к free.
- Ученик в Business-орге наследует Pro. Клиентские замки — только UX; сервер решает сам.
- Биллинга нет намеренно: `/upgrade` — заглушка с mailto; планы выставляются руками в `/admin/orgs`.

**B+H. Роли/организации + правила**
- Модель: `users/{uid}` (role, plan, orgId) · `orgs/{orgId}` (joinCode для учеников **и отдельный** counselorCode для менторов, plan, seats) · `orgs/{orgId}/members/{uid}` · `joinCodes/{CODE}` (резолв кода → орг) · `portfolios/{uid}` (+orgId, orgName, shareId) · `portfolios/{uid}/comments` · `portfolios/{uid}/chat` · `shares/{shareId}`.
- Подключение: `/counselor/new` (самосервис, орг всегда free), `/join/{code}` (экран согласия), ввод кода в карточке «Your mentor» в портфолио. Ученик видит, кто имеет доступ, и **отключается в 1 клик**.
- `firestore.rules` переписаны: план/seats меняет только founder; вступление по коду проверяется через `get()` на орг-док; counselor читает только портфолио учеников своего орга; публичного чтения `portfolios` нет — публичны только курируемые `shares`.

**C. Дашборды**
- `/counselor`: ростер с кольцом strength, completeness, флагами («No GPA», «Membership, not leadership»…), 1–2 «talking points» на встречу, сортировка «needs attention», коды приглашений, CSV (Business; на free — замок с апселлом).
- `/counselor/student/[uid]`: read-only портфолио, reference-odds (MIT/UMich), сохранённый AI-ревью ученика, комментарии по секциям.
- `/admin`: агрегаты когорты, команда, коды, seats, Business-апселл. `/admin/orgs` — founder-консоль.

**D. Share** — снапшоты `shares/{shareId}` (эссе приватны по умолчанию, чекбоксы), автообновление при правках, страница `/p/{id}` с OG-метой, футер «Made with Folio · Build yours free» (Pro — без бейджа, Business — «Presented by <школа>»).

**E. PDF** — `/portfolio/print`: print-CSS + `window.print()`, Common App-вид, ноль зависимостей. Free — сноска «Made with Folio», Pro — чистый, Business — брендированный. (Вотермарк гейтится на клиенте — это косметика, обходится только правкой DOM самим пользователем; сознательный компромисс.)

**F. AI-фичи** — `/api/essay` (строгий JSON: структура-оценки, show-don't-tell с цитатами, line edits, before/after, без выдумывания фактов) и `/api/counselor` (стратег-чат с компактной сводкой профиля, историей 6 реплик). Free: 1 разбор + 3 сообщения в день; Pro: 12 и 80. Всё за серверным гейтом; 429 отдаёт `upgrade:true` → UI показывает золотой апселл.

**G. Лендинг** — анимированный hero (глоу, поэтапный вход, растущие бары шансов, плавающий чип), секция «For schools & counselors» с мини-мокапом ростера, блок Pricing из `lib/plans.js`, scroll-reveal. Все анимации отключаются при `prefers-reduced-motion`. Проверено вживую на 390×844 и 1280×800 — оверфлоу нет, консоль чистая.

**K. Дедлайны** — `lib/deadlines.js`: приблизительные месяцы для ~30 главных возможностей (точных дат нет нигде — всюду «≈ месяц · verify with source»); кнопка «Track deadline» в /discover; карточка «My deadlines» с бэйджами «in N d» (красный ≤14 дней), recurring — 9-е классы видят следующий цикл. Розетка доставки: `/api/cron/reminders` (501 + чеклист, см. ниже).

**I. CONTENT.md** — канал-приоритеты (Telegram → консультанты → Reels → SEO), 4-недельный план постов, B2B-питч, воронка GA4.

---

## Ручные шаги владельца (обязательные)

1. **Firestore Rules.** Firebase Console → Firestore → Rules → вставить содержимое `firestore.rules` → Publish. **Внутри `isFounder()` уже стоит `djdjdj.9413@gmail.com`** — проверь/дополни список своих Google-адресов.
2. **Env на Vercel** (Settings → Environment Variables), плюс локально в `.env.local`:
   - `FOLIO_ADMIN_EMAILS=djdjdj.9413@gmail.com` — те же адреса, что в rules (открывает `/admin/orgs`).
   - Уже настроенные ключи (GROQ/OPENROUTER/GEMINI/FIREBASE/GA) — не забудь продублировать на Vercel, если ещё нет.
3. **Проверка после деплоя:** зайти под своим аккаунтом → `/admin/orgs` должен открыться; создать тестовый орг на `/counselor/new`, зайти учеником по коду со второго аккаунта, убедиться что портфолио видно в ростере.

## Ручные шаги (опциональные)

- **Upstash Redis** (durable rate-limit между инстансами): upstash.com → бесплатный Redis → `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`. Без него лимиты in-memory (норм на старте).
- **Индексы Firestore:** текущие запросы простые; единственный составной кейс — `users where email ==` в founder-консоли (одиночное поле, индекс не нужен). Если консоль когда-то попросит индекс — Firebase сам даст ссылку «создать».
- **Доставка напоминаний о дедлайнах** (когда будет время):
  1) Vercel Cron: в `vercel.json` → `{"crons":[{"path":"/api/cron/reminders","schedule":"0 9 * * *"}]}` (1 job — бесплатно на Hobby);
  2) `CRON_SECRET` (Vercel генерирует), `RESEND_API_KEY` (resend.com free tier) **или** Telegram-бот (`TELEGRAM_BOT_TOKEN` — для СНГ лучше);
  3) сервисный аккаунт Firebase (`FIREBASE_SERVICE_ACCOUNT_JSON`) — cron без пользователя может читать все `trackedDeadlines` только через Admin SDK. Роут-заглушка уже описывает, что дописать.
- **Платёжка (когда пойдут деньги):** для мира — Paddle (merchant of record, меньше бюрократии, чем Stripe, для КЗ-юрлица); для СНГ-карт — локальный провайдер (Kaspi Pay / CloudPayments). До тех пор: продажа руками → план в `/admin/orgs`. Код к платёжке готов: серверные гейты уже читают `plan` из Firestore, останется писать `plan` из вебхука.
- **Цены:** правь только `lib/plans.js` (`price.label`, лимиты, seats).

## Как «передавать» продукт клиенту (продажа Business)

1. Клиент создаёт workspace `/counselor/new` (free-пилот: 3 ученика, полный дашборд).
2. Ты в `/admin/orgs`: его орг → **Business**, seats → по договорённости.
3. Он шлёт ученикам ссылку `/join/FOLIO-XXXX`. Менторам — код MENTOR-XXXX.
4. Отдельному ученику Pro продаёшь так же: `/admin/orgs` → «Grant student Pro» по email (он должен хоть раз войти).

## Что осталось / осознанные компромиссы

- **Тесты на `lib/chances.js` не добавлял** — логика шансов не менялась (бриф: покрывать при изменении).
- Вотермарк PDF и бейдж share гейтятся на клиенте (косметика); все AI-фичи — строго на сервере.
- `joinCodes` может создать любой залогиненный (форжить чужой код нельзя — вступление сверяется с орг-доком; возможен только мусор в неймспейсе).
- Кэш AI по-прежнему in-memory (вынос в durable — опционально, как и было).
- Секция «For schools» на лендинге и founder-консоль на английском, как весь продукт; русская локализация — отдельная фаза (см. ROADMAP Phase 2).
- Email `hello@folio.app` в /upgrade и CONTENT.md — плейсхолдер, замени на реальный.
- SEO-страницы `/discover/[id]` — следующий кандидат в бэклог (упомянуто в CONTENT.md).
