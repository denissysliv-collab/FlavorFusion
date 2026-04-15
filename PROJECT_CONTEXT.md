# 📖 FlavorFusion — Контекст проекта

> **Последнее обновление:** 13 апреля 2026
> 
> **Назначение:** Этот файл содержит полную историю, архитектуру и текущее состояние проекта.
> При переходе в новый чат — прочти его первым делом.

---

## 🎯 Суть проекта

**FlavorFusion** — это веб-платформа (социальная сеть) для публикации, поиска и обмена кулинарными рецептами. Пользователи могут:
- Публиковать свои рецепты с фото, ингредиентами и инструкциями
- Просматривать рецепты других пользователей
- Добавлять рецепты в избранное (❤️ с обводкой → закрашенное)
- Вести профиль с аватаром и описанием
- Фильтровать рецепты по категориям и искать по названию

**Аналоги:** Eda.ru, AllRecipes, JamieOliver.com

---

## 🏗️ Архитектура

### Фронтенд (готово)
- **Технологии:** Чистый HTML + CSS + JavaScript (без фреймворков)
- **Страницы:**

| Файл | Страница | Описание |
|------|----------|----------|
| `index.html` | Главная | Поиск, категории, лента рецептов (`#recipesContainer`) |
| `add-recipe.html` | Добавить рецепт | Форма создания рецепта (ссылка ИЛИ файл изображения) |
| `profile.html` | Профиль | Табы: мои рецепты, избранное, активность, настройки |
| `recipe-detail.html` | Страница рецепта | Детальный просмотр (hero, ингредиенты, шаги, сайдбар) |
| `registration/login.html` | Вход | Форма логина |
| `registration/register.html` | Регистрация | Форма регистрации |
| `primer/` | Макеты-референсы | `card_page.html` — карточка, `recipe_page.html` — страница рецепта |

### Бэкенд (готов)
- **Технологии:** Node.js + Express + PostgreSQL
- **Авторизация:** JWT (JSON Web Tokens)
- **Расположение:** папка `backend/`

---

## 🗄️ База данных

### Таблицы (PostgreSQL)

#### `users` — Пользователи
```
id (PK), username (UNIQUE), email (UNIQUE), password_hash (bcrypt),
avatar_url, bio, created_at, updated_at
```

#### `recipes` — Рецепты
```
id (PK), author_id (FK → users.id), title, description, full_description,
image_url, ingredients (JSONB), instructions, time, difficulty,
category, servings, tags, calories, protein, carbs, fat, notes,
views_count, created_at, updated_at
```

#### `favorites` — Избранное
```
id (PK), user_id (FK → users.id), recipe_id (FK → recipes.id), created_at
UNIQUE(user_id, recipe_id)
```

#### `likes` — Лайки на рецепты
```
id (PK), user_id (FK → users.id), recipe_id (FK → recipes.id), created_at
UNIQUE(user_id, recipe_id)
```

#### `activity_log` — Активность пользователя
```
id (PK), user_id (FK → users.id), action, recipe_id (FK → recipes.id),
recipe_title, created_at
```

### 🔗 Ключевая архитектурная особенность

**Данные автора (username, avatar_url) НЕ копируются в таблицу recipes.**

Рецепты подтягивают данные автора через `INNER JOIN users ON recipes.author_id = users.id`.

**Зачем:**
- Пользователь меняет имя/аватар → изменения мгновенно видны во всех его рецептах
- Нет дублирования данных
- Один источник правды

---

## 🔌 API Endpoints

Базовый URL: `http://localhost:5000/api`

### Авторизация (публичные)
| Метод | Путь | Описание |
|-------|------|----------|
| POST | `/auth/register` | Регистрация → JWT |
| POST | `/auth/login` | Вход → JWT |

### Рецепты
| Метод | Путь | Доступ | Описание |
|-------|------|--------|----------|
| GET | `/recipes` | Публичный | Список (пагинация, фильтр, поиск) |
| GET | `/recipes/:id` | Публичный | Один рецепт |
| POST | `/recipes` | 🔒 JWT | Создать рецепт |
| DELETE | `/recipes/:id` | 🔒 JWT | Удалить свой рецепт |
| POST | `/recipes/:id/favorite` | 🔒 JWT | Toggle избранного |
| POST | `/recipes/:id/like` | 🔒 JWT | Лайк рецепта (toggle) |

### Пользователи
| Метод | Путь | Доступ | Описание |
|-------|------|--------|----------|
| GET | `/users/me` | 🔒 JWT | Мой профиль (user + recipes + totalLikes + totalFavorites) |
| PATCH | `/users/me` | 🔒 JWT | Обновить имя/аватар/bio |
| GET | `/users/me/favorites` | 🔒 JWT | Мои избранные |
| GET | `/users/:id` | Публичный | Публичный профиль + рецепты |

---

## 📁 Структура проекта

```
IWUDG/
├── index.html                          # Главная
├── add-recipe.html                     # Добавить рецепт
├── profile.html                        # Профиль
├── recipe-detail.html                  # Страница рецепта
├── registration/
│   ├── login.html                      # Вход
│   └── register.html                   # Регистрация
├── primer/                             # Макеты-референсы (НЕ часть сайта!)
│   ├── card_page.html                  # Демо карточки
│   └── recipe_page.html                # Демо страницы рецепта
├── images/                             # Картинки
├── js/
│   ├── auth-check.js                   # Проверка авторизации, управление навигацией
│   ├── recipes-feed.js                 # Рендеринг ленты рецептов на index.html
│   ├── profile-edit.js                 # Редактирование профиля (устарел, в profile.html inline)
│   └── profile-recipes.js              # Мои рецепты + избранное в профиле
├── style/
│   ├── index_style/index.css
│   ├── add--recipe_style/
│   │   ├── add-recipe1.css
│   │   └── add-recipe2.css
│   └── profile/
│       └── profil.css
├── PROJECT_CONTEXT.md                  # ЭТОТ ФАЙЛ
└── backend/                            # ← СЕРВЕРНАЯ ЧАСТЬ
    ├── server.js                       # Точка входа
    ├── package.json
    ├── .env                            # Переменные окружения
    ├── API.md                          # Полная документация API
    ├── controllers/
    │   ├── authController.js           # Регистрация, логин
    │   ├── userController.js           # Профиль, обновление
    │   ├── recipeController.js         # CRUD рецептов
    │   └── favoriteController.js       # Избранное
    ├── models/
    │   ├── User.js                     # Модель пользователя
    │   ├── Recipe.js                   # Модель рецепта (с JOIN)
    │   ├── Favorite.js                 # Модель избранного (+ countAuthorFavorites)
    │   ├── Like.js                     # Модель лайков (toggle, countAuthorLikes)
    │   └── Activity.js                 # Модель активности (лог действий)
    ├── routes/
    │   ├── auth.js                     # /api/auth/*
    │   ├── users.js                    # /api/users/*
    │   └── recipes.js                  # /api/recipes/*
    ├── middleware/
    │   └── auth.js                     # JWT проверка (обязательная + опциональная)
    └── database/
        ├── pool.js                     # Pool подключений
        ├── schema.sql                  # SQL-схема таблиц
        ├── migrate.js                  # Скрипт миграции
        ├── setup.js                    # Автоматическое создание БД
        └── seed.js                     # Тестовые данные
```

---

## ✅ Что уже сделано

### Фронтенд
- ✅ Все HTML-страницы свёрстаны и стилизованы
- ✅ Адаптивный дизайн (десктоп + мобильные)
- ✅ Мобильное меню (бургер) с элементами авторизации
- ✅ Форма добавления рецепта с загрузкой файла ИЛИ ссылкой
- ✅ Страница профиля с табами (мои рецепты, избранное, активность, настройки)
- ✅ Страница детального просмотра рецепта (recipe-detail.html)
- ✅ Карточки рецептов с hover-эффектами и ❤️ (обводка ↔ закрашенное)
- ✅ Категории с аккордеоном на мобильных
- ✅ Кнопка «Назад» в мобильном header на recipe-detail.html
- ✅ Навигация: авторизация через `auth-check.js`, данные из API

### Бэкенд
- ✅ Полная структура проекта (controllers, models, routes, middleware)
- ✅ Схема БД с правильными связями (JOIN по author_id)
- ✅ JWT аутентификация (обязательная + опциональная)
- ✅ Регистрация и логин с валидацией
- ✅ CRUD для рецептов
- ✅ Избранное (toggle)
- ✅ Обновление профиля
- ✅ Пагинация, поиск, фильтрация рецептов
- ✅ CORS настроен
- ✅ Автоматическая инициализация БД (`npm run init-db`)
- ✅ Seed с тестовыми рецептами от test_1

---

## 🚧 Что ещё нужно сделать

### Приоритет 1 — Доработки
- [ ] Редактирование рецепта (edit-recipe.html)
- [ ] Страница избранного (`favorites.html`)
- [ ] Комментарии к рецептам
- [ ] Лайки/рейтинги рецептов
- [ ] Загрузка реальных файлов аватаров (multer)

### Приоритет 2 — Production
- [ ] Настроить CORS для конкретного домена
- [ ] HTTPS
- [ ] Rate limiting
- [ ] Кэширование популярных рецептов
- [ ] Деплой

---

## 🚀 Как запустить

### Бэкенд
```bash
cd backend
npm install
# Создать БД: npm run init-db
# Seed тестовыми данными: npm run db:seed
npm run dev
# Сервер: http://localhost:5000
```

### Фронтенд
```bash
# Открыть index.html в браузере или через Live Server
```

---

## 🔑 Важные детали для нейросети

### Цветовая схема (CSS переменные)
```css
--primary-color: #FF6B6B       /* Коралловый */
--secondary-color: #4ECDC4     /* Бирюзовый */
--accent-color: #FFD166        /* Жёлтый */
--dark-color: #2D3436          /* Тёмный */
--danger-color: #D63031        /* Красный (удаление, избранное) */
--font-primary: 'Poppins'
--font-secondary: 'Playfair Display'
```

### Формат токена в запросах
```
Authorization: Bearer <jwt_token>
```

### Фронтенд хранит ТОЛЬКО токен:
```javascript
localStorage.setItem('token', token);
// Данные профиля — только через GET /api/users/me
```

### Рецепты приходят с полями автора:
```json
{
  "author_id": 1,
  "author_username": "MariaChef",
  "author_avatar_url": "https://..."
}
```

### Кнопки на карточках — 2 состояния каждая:
- **👍 Лайк (золотой #FFD166):** `-webkit-text-stroke: 1.5px #FFD166; color: transparent` → закрашено золотым
- **❤️ Избранное (коралловый #FF6B6B):** `-webkit-text-stroke: 1.5px #FF6B6B; color: transparent` → закрашено коралловым

---

## 📝 Решения и их обоснование

| Решение | Почему |
|---------|--------|
| PostgreSQL вместо MongoDB | Реляционные связи (JOIN) критичны для динамических данных автора |
| Автор через `author_id` (FK), не копируется | Изменения профиля мгновенно видны везде |
| JWT вместо сессий | Stateless, удобно для SPA |
| Опциональный auth middleware | `/recipes` публичный, но добавляем `is_favorite` если авторизован |
| ingredients как JSONB | Гибкая структура, удобный запрос в PostgreSQL |
| Без фреймворка на фронтенде | Простота, проект уже работает на чистом JS |
| Базовая аутентификация | Простая регистрация через email/password |
| Тестовые данные | Seed с 6 рецептами от test_1 для демонстрации |
