# FitMind — Your wellness, precisely tracked

Веб-додаток для відстеження фізичних тренувань, ментального здоров’я та харчування з дашбордом, прогресом, рівнями та адмін-панеллю.

---

## Зміст

- [Огляд проєкту](#огляд-проєкту)
- [Стек технологій](#стек-технологій)
- [Ієрархія проєкту](#ієрархія-проєкту)
- [Як працює додаток](#як-працює-додаток)
- [Зберігання даних](#зберігання-даних)
- [Важливі нюанси розробки](#важливі-нюанси-розробки)
- [Запуск та збірка](#запуск-та-збірка)

---

## Огляд проєкту

FitMind — це **single-page application (SPA)**. Усі дані (користувачі, прогрес, вправи, сесії) зберігаються на **бекенді (Node.js + Express)** у JSON-файлах, авторизація через JWT. Додаток завжди працює з API: у розробці фронт звертається до http://localhost:3001, на хостингу — до того ж хосту (один сервер віддає і API, і статику). Користувачі реєструються (email + пароль), отримують особистий дашборд з метриками (BMI, вага, стрік, ранг, XP/рівень), бібліотеку тренувань із таймером та прогресом, розділ ментального здоров’я (медитації, дихання, сон), журнал харчування та профіль. **Перший зареєстрований користувач** автоматично отримує роль адміна і доступ до адмін-панелі (CRUD вправ Fitness і Mental Health, список користувачів з пошуком/баном/ролями, діаграми демографії).

---

## Стек технологій

### Мова та середовище

| Технологія | Версія | Призначення |
|------------|--------|-------------|
| **TypeScript** | ^5.3.0 | Статична типізація, безпека та підказки в IDE. Проєкт використовує `strict: true`, ESNext модулі, `jsx: "react-jsx"`. |
| **Node.js** | — | Середовище для запуску npm-скриптів та збірки (Vite). |
| **npm** | — | Менеджер пакетів (залежності з `package.json`). |

### Збірка та інструменти

| Технологія | Версія | Призначення |
|------------|--------|-------------|
| **Vite** | ^5.0.0 | Збірник та dev-сервер: швидкий HMR, ESM, `root: '.'`, `publicDir: 'public'`. |
| **@vitejs/plugin-react** | ^4.2.0 | Плагін Vite для React (JSX/TSX, Fast Refresh). |
| **PostCSS** | ^8.4.0 | Обробка CSS (підключення Tailwind та Autoprefixer). |
| **Autoprefixer** | ^10.4.0 | Додавання вендорних префіксів до CSS. |

### UI та стилі

| Технологія | Версія | Призначення |
|------------|--------|-------------|
| **React** | ^18.2.0 | Бібліотека для побудови інтерфейсу (компоненти, хуки, контекст). |
| **react-dom** | ^18.2.0 | Рендер React у DOM; точка входу — `createRoot(root).render(<App />)` у `index.tsx`. |
| **Tailwind CSS** | ^3.4.0 | Utility-first CSS: класи в JSX, `content` у `tailwind.config.js` вказує на `index.html`, `App.tsx`, `components`, `pages`, `contexts`, `lib`. Режим темної теми: `darkMode: 'class'`. Кастомні кольори через CSS-змінні (`--bg-primary`, `--accent` тощо). |
| **Framer Motion** | ^11.0.0 | Анімації: `motion.div`, `AnimatePresence`, `layout`, `initial`/`animate`/`exit`, `transition`. Використовується на сторінках (Fitness, Mental Health, Dashboard, Admin) та в сайдбарі (підсвітка активного пункту). |
| **Lucide React** | ^0.400.0 | Набір іконок (Play, Clock, Flame, ChevronLeft, Check, Shield, User тощо). |
| **Recharts** | ^2.12.0 | Графіки: `AreaChart`, `BarChart`, `LineChart`, `XAxis`, `YAxis`, `Tooltip`, `ResponsiveContainer`. Використовується на Dashboard (спарклайни, кільцевий прогрес, Weekly Activity) та в адмінці (Demographics). |

### Маршрутизація та стан

| Технологія | Версія | Призначення |
|------------|--------|-------------|
| **react-router-dom** | ^6.22.0 | Маршрутизація: `BrowserRouter`, `Routes`, `Route`, `Navigate`, `Link`, `useLocation`, `useNavigate`. Захищені маршрути (ProtectedRoute, AdminRoute) та публічні (PublicRoute). |

### Типи (dev)

| Пакет | Версія | Призначення |
|-------|--------|-------------|
| **@types/react** | ^18.2.0 | Типи для React. |
| **@types/react-dom** | ^18.2.0 | Типи для react-dom. |

---

## Ієрархія проєкту

```
FitMind/
├── index.html              # Єдина HTML-сторінка; <div id="root">, підключення /index.tsx
├── index.tsx               # Точка входу: import index.css, createRoot(root).render(<App />)
├── index.css               # Глобальні стилі, @tailwind, CSS-змінні теми (:root / .dark), шрифт Inter
├── App.tsx                 # ThemeProvider → AuthProvider → Router → Routes (Protected/Public/Admin)
├── package.json            # Залежності та скрипти (dev, build, preview)
├── package-lock.json
├── tsconfig.json           # TypeScript: target ES2020, module ESNext, strict, jsx react-jsx, include компонентів/сторінок/контекстів/lib
├── tsconfig.tsbuildinfo
├── vite.config.ts          # Vite: plugin react, root '.', publicDir 'public'
├── tailwind.config.js      # content paths, darkMode 'class', extend colors (bg, text, border, accent)
├── postcss.config.js       # Плагіни tailwindcss та autoprefixer
│
├── components/
│   ├── Layout.tsx          # Обгортка: Sidebar + основний контент (outlet для сторінок)
│   ├── Logo.tsx            # SVG-логотип FitMind (розмір через prop)
│   ├── Sidebar.tsx         # Фіксована ліва панель: лого, навігація (Dashboard, Fitness, Mental Health, Nutrition, Profile), пункт Admin (тільки для isAdmin), блок юзера та Sign Out
│   └── ThemeContext.tsx    # Контекст теми (light/dark), збереження в localStorage, toggleTheme
│
├── contexts/
│   └── AuthContext.tsx     # Користувач, appData, login/signup/logout, updateAppData, recordWorkoutDay, recordMindfulnessSession, addXpFromProgress, isAdmin тощо
│
├── lib/
│   ├── types.ts            # Інтерфейси User, AppData, FoodEntry, UserRole; константи (RANK_NAMES, XP_PER_LEVEL, WORKOUTS_FOR_FULL тощо)
│   ├── storage.ts          # getToday, recomputeStreakAndRank; допоміжні функції для локальної логіки (без зберігання користувачів/appData — вони на бекенді)
│   ├── api.ts              # Клієнт бекенду: getBaseUrl (dev: localhost:3001, prod: ''), getToken, apiLogin, apiSignup, apiGetAppData, apiPutAppData, apiGetWorkouts, apiGetSessions, admin-ендпоінти, apiGetTopPercent
│   ├── adminStorage.ts     # fitmind_workouts / fitmind_mindfulness_sessions: getStoredWorkouts, saveStoredWorkouts, getWorkouts (з валідацією та fallback на дефолт), getStoredSessions, saveStoredSessions, getSessions
│   ├── workouts.ts         # Категорії, тип WorkoutItem, масив workouts (дефолтна бібліотека вправ з videoUrl?)
│   └── mentalHealth.ts     # Типи MindfulnessSession, MindfulnessSessionStored, MindfulnessIconName, sessionsStoredDefault, storedSessionToUI, мапа іконок
│
├── backend/                # Бекенд (Node.js, ESM)
│   ├── package.json        # express, cors, jsonwebtoken, sql.js
│   ├── server.js           # Express: CORS, JWT, маршрути /api/auth/*, /api/user, /api/app-data, /api/workouts, /api/sessions, /api/admin/*, /api/top-percent; initDb() перед listen
│   ├── db.js               # SQLite (sql.js): initDb(), міграції (users, app_data, store), збереження у data/fitmind.db, dbGetUsers, dbSaveUsers, dbGetAppData, dbSaveAppData, dbGetStore, dbSetStore
│   ├── store.js            # Логіка поверх БД: getToday, recomputeStreakAndRank, getUsers, saveUsers, getAppData, saveAppData, getWorkouts, getSessions тощо
│   └── data/               # Папка для fitmind.db (SQLite); створюється при першому запуску
│
├── pages/
│   ├── LoginPage.tsx       # Форма логіну (email, password), PublicRoute
│   ├── SignUpPage.tsx      # Багатокрокова реєстрація (облікові дані, цілі, профіль), PublicRoute
│   ├── DashboardPage.tsx   # Привітання, картки BMI/Weight/Streak/Rank з спарклайнами, Weekly Activity (heatmap з виносками), Your Progress (кільця + XP), ProtectedRoute
│   ├── FitnessPage.tsx     # Бібліотека вправ (getWorkouts), таймер, прогрес, Completed-бейдж, відео (videoUrl), ProtectedRoute
│   ├── MentalHealthPage.tsx # Сесії (getSessions), таймер, прогрес, аудіо (audioUrl), сон (sleep log + графік), ProtectedRoute
│   ├── NutritionPage.tsx   # Журнал харчування (день, прийоми їжі, калорії), ProtectedRoute
│   ├── UserProfilePage.tsx # Профіль, редагування даних, тема, сповіщення, видалення акаунта, ProtectedRoute
│   └── AdminPage.tsx       # Таби: Fitness (CRUD вправ + videoUrl), Mental Health (CRUD сесій + audioUrl), Users (пошук, role/ban), Demographics (BarChart тренувань і сесій), AdminRoute
│
├── public/                 # Статичні файли (якщо є)
└── dist/                   # Результат vite build (не комітиться в опис логіки)
```

**Коротко по ключових файлах:**

- **index.html** — єдиний HTML; скрипт `type="module"` на `/index.tsx`.
- **index.tsx** — підключає `index.css` і рендерить `<App />` у `#root`.
- **App.tsx** — обгортає додаток у `ThemeProvider` і `AuthProvider`, задає `Router` і всі `Route`; окремі компоненти `ProtectedRoute`, `PublicRoute`, `AdminRoute` для доступу за роллю.
- **Layout** — сайдбар + область контенту; використовується для всіх захищених сторінок і адмінки.
- **AuthContext** — єдине джерело правди для `user` та `appData`; оновлення через `updateAppData` з функціональним сетером, щоб кілька оновлень по черзі не перезаписували одне одного.
- **lib/storage.ts** — робота з `fitmind_users`, `fitmind_current_user_id`, `fitmind_data_<userId>`; щоденний скид лічильників (workoutsCompletedToday тощо) за `dailyProgressResetDate`.
- **lib/adminStorage.ts** — контент адмінки: вправи та сесії з валідацією; при порожньому або невалідному сховищі повертається дефолтний список і він же записується в localStorage.

---

## Як працює додаток

### Точка входу та провайдери

1. **index.tsx** — підключає глобальні стилі та рендерить `<App />`.
2. **App** — обгортає дерево в `ThemeProvider` (тема зберігається в localStorage і в классі `document.documentElement`), потім у `AuthProvider` (користувач і appData з localStorage, логін/логаут/оновлення даних).
3. **Router** — історія браузера; **Routes** визначають, яка сторінка рендериться за шляхом.

### Маршрути та захист

- **Публічні:** `/login`, `/signup` — обгорнуті в **PublicRoute**: якщо користувач вже залогінений, редірект на `/dashboard`.
- **Захищені:** `/dashboard`, `/fitness`, `/mental-health`, `/nutrition`, `/profile` — обгорнуті в **ProtectedRoute**: якщо немає користувача, редірект на `/login`. Рендерять **Layout** (сайдбар + контент) і відповідну сторінку.
- **Адмін:** `/admin` — обгорнуто в **AdminRoute**: потрібен залогінений користувач з `user.role === 'admin'`; інакше редірект на `/dashboard`.
- **/** — редірект на `/login`.

Пункт «Admin» у сайдбарі показується лише коли `useAuth().isAdmin === true`.

### Авторизація та ролі

- **Реєстрація:** у **AuthContext** при створенні нового користувача перевіряється `users.length === 0`; якщо так — першому присвоюється `role: 'admin'`, інакше `role: 'user'`. Поле `banned: false` за замовчуванням.
- **Логін:** перевірка email/пароля по масиву `getUsers()`; якщо `user.banned === true`, повертається помилка «This account has been suspended.» У контекст експортується **isAdmin** = `user?.role === 'admin'`.
- Роль і бан змінюються в адмінці через **storage**: `setUserRole(userId, role)`, `setUserBanned(userId, banned)`.

### Теми

- **ThemeContext** зберігає `theme: 'light' | 'dark'` у localStorage і виставляє класс `light` або `dark` на `document.documentElement`.
- В **index.css** змінні `--bg-primary`, `--text-primary`, `--accent` тощо задані для `:root` (світла тема) і для `.dark` (темна). Tailwind використовує ці змінні через `theme.extend.colors` у конфігу.

### Дані користувача (AppData)

- **appData** — прогрес по днях: стрік, rankPoints, workoutDays, workoutsByDay, exerciseProgress, mindfulnessProgress, щоденні лічильники (workoutsCompletedToday, nutritionPercentToday тощо), xp/level, історії (streakHistory, rankHistory, weightHistory).
- Оновлення тільки через **updateAppData(updater)**. Усередині використовується функціональний сетер `setAppDataState(prev => ...)`, щоб кілька викликів по черзі (наприклад recordWorkoutDay + оновлення exerciseProgress) не перезаписували одне одного.
- Щоденний скид лічильників відбувається в **getAppData**: якщо `dailyProgressResetDate !== today`, значення скидаються і зберігаються знову.

### Fitness та Mental Health

- **Вправи Fitness** беруться з **getWorkouts()** (lib/adminStorage): якщо в localStorage є валідний список — він використовується; інакше повертається і записується дефолтний масив з **lib/workouts**. Валідація перевіряє наявність обов’язкових полей (id, title, durationMinutes тощо), щоб уникнути NaN і порожніх карток.
- **Сесії Mental Health** беруться з **getSessions()**: аналогічно — збережений список або дефолт з **sessionsStoredDefault** (lib/mentalHealth). Для UI іконки мапляться з **iconName** через **storedSessionToUI**.
- Якщо у вправи є **videoUrl** — на Fitness показується відео (пряме посилання або YouTube iframe). Якщо у сесії є **audioUrl** — на Mental Health показується `<audio controls>`.

### Адмін-панель

- **Fitness** — список вправ з API; додавання/редагування/видалення; форма з усіма полями WorkoutItem + Video URL. Збереження через PUT /api/workouts.
- **Mental Health** — список сесій з API; CRUD; форма з полями MindfulnessSessionStored + Audio URL та вибір іконки. Збереження через PUT /api/sessions.
- **Users** — список з GET /api/admin/users; пошук по імені/email/id; таблиця з role та banned; кнопки зміни ролі та бану через PATCH /api/admin/users/:id.
- **Demographics** — GET /api/admin/demographics: підрахунок виконань тренувань і завершених сесій; два BarChart (Recharts).

---

## Зберігання даних

Усі дані зберігаються на **бекенді** в базі даних **SQLite** (файл `backend/data/fitmind.db`). Схема:

| Таблиця | Опис |
|---------|------|
| **users** | Користувачі: id, email, password, name, height, weight, age, daily_calorie_goal, theme, notifications (JSON), created_at, role, banned. Паролі зберігаються у відкритому вигляді (для продакшену варто хешування). |
| **app_data** | Один рядок на користувача (user_id, data JSON): streak, rankPoints, workoutDays, workoutsByDay, exerciseProgress, mindfulnessProgress, щоденні лічильники, xp, level, історії тощо. При видаленні користувача запис видаляється (CASCADE). |
| **store** | Ключ-значення (key, value): ключі `workouts` та `sessions` — JSON-масиви вправ і сесій Mindfulness для адмінки. |

БД створюється та оновлюється при першому запуску бекенду (модуль `backend/db.js`, міграції в коді). У браузері в localStorage зберігаються лише **JWT** (`fitmind_token`) та **тема** (`theme`). Формат дат: **YYYY-MM-DD** (функція **getToday()** у lib/storage і на бекенді).


---

## Важливі нюанси розробки

1. **Оновлення appData:** завжди через **updateAppData(updater)**. У контексті використовується функціональний сетер, щоб послідовні виклики (наприклад recordWorkoutDay і оновлення exerciseProgress) не перезаписували попередні зміни через застарілий стан.
2. **Перший користувач — адмін:** при signup перевіряється `users.length === 0`; якщо так, новому користувачу ставиться `role: 'admin'`.
3. **Заблоковані користувачі:** при логіні перевіряється `user.banned`; якщо true, логін повертає помилку.
4. **Вправи Fitness:** getWorkouts() валідує збережений масив (isWorkoutValid); при порожньому або невалідному повертається і записується дефолтний список з lib/workouts, щоб не було NaN і порожніх карток.
5. **Mental Health іконки:** у сховищі зберігається тільки **iconName** (Wind, Moon, Heart, Headphones); при читанні для UI використовується **storedSessionToUI**, який підставляє відповідний компонент іконки з Lucide.
6. **Щоденний скид:** у getAppData при зміні дня (dailyProgressResetDate !== today) скидаються workoutsCompletedToday, mindfulnessCompletedToday, nutritionPercentToday і результат зберігається.
7. **Streak і rank:** обчислюються в **recomputeStreakAndRank** (storage) за масивом workoutDays; при записі тренування викликається recordWorkoutDay і потім recomputeStreakAndRank у контексті.
8. **Tailwind:** усі шляхи до компонентів і сторінок указані в **content** у tailwind.config.js; темна тема через класс `.dark` на корені документа.

---

## Запуск та збірка

### Локальна розробка

1. **Бекенд** (обов’язково спочатку):
   ```bash
   cd backend
   npm install
   npm run dev
   ```
   Сервер: http://localhost:3001

2. **Фронтенд** (у корені проєкту):
   ```bash
   npm install
   npm run dev
   ```
   Додаток: http://localhost:5173 (запити до API йдуть на http://localhost:3001).

Після клонування проєкту виконайте **npm install** у корені та **npm install** у `backend/`. Без запущеного бекенду логін і дані працювати не будуть.

### Хостинг (один сервер)

Додаток можна захостити так, щоб один процес віддавав і API, і фронт:

1. У **корені** проєкту зібрати фронт:
   ```bash
   npm run build
   ```
   Результат у папці `dist/`.

2. Запустити тільки бекенд:
   ```bash
   cd backend
   npm install
   npm start
   ```
   Бекенд віддає статику з `../dist/` і обслуговує API. Відкривай сайт за адресою **http://localhost:3001** (або ваш домен/порт). Для продакшену задайте змінну середовища **JWT_SECRET** та при потребі **PORT**.

Якщо API і фронт на різних доменах, при збірці задайте **VITE_API_URL** (наприклад `https://api.example.com`), щоб запити йшли на правильний хост.

- **Збірка:** `npm run build` — `tsc -b` та `vite build`; результат у `dist/`.
- **Перегляд збірки локально:** `npm run preview` — тільки фронт; для повної перевірки краще зібрати і запустити бекенд, як вище.
