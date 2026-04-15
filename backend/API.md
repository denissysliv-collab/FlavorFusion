# FlavorFusion API — Документация

## 📋 Оглавление
- [Структура базы данных](#структура-базы-данных)
- [Архитектура связей](#архитектура-связей)
- [API Endpoints](#api-endpoints)
- [Установка и запуск](#установка-и-запуск)
- [Примеры запросов](#примеры-запросов)

---

## 🗄️ Структура базы данных

### Таблица `users` (Пользователи)

| Поле           | Тип          | Описание                        |
|----------------|--------------|---------------------------------|
| `id`           | SERIAL       | Первичный ключ                  |
| `username`     | VARCHAR(50)  | Имя пользователя (уникальное)   |
| `email`        | VARCHAR(255) | Email (уникальный)              |
| `password_hash`| VARCHAR(255) | Хеш пароля (bcrypt)             |
| `avatar_url`   | TEXT         | Ссылка на аватар                |
| `bio`          | TEXT         | Описание пользователя           |
| `created_at`   | TIMESTAMP    | Дата регистрации                |
| `updated_at`   | TIMESTAMP    | Дата последнего обновления       |

### Таблица `recipes` (Рецепты)

| Поле             | Тип          | Описание                           |
|------------------|--------------|------------------------------------|
| `id`             | SERIAL       | Первичный ключ                     |
| `author_id`      | INT (FK)     | **Внешний ключ** → `users(id)`     |
| `title`          | VARCHAR(255) | Название рецепта                   |
| `description`    | TEXT         | Краткое описание                   |
| `full_description`| TEXT        | Подробное описание                 |
| `image_url`      | TEXT         | Ссылка на изображение              |
| `ingredients`    | JSONB        | Массив ингредиентов                |
| `instructions`   | TEXT         | Инструкция приготовления           |
| `time`           | VARCHAR(50)  | Время приготовления                |
| `difficulty`     | VARCHAR(50)  | Сложность                          |
| `category`       | VARCHAR(100) | Категория                          |
| `servings`       | INT          | Количество порций                  |
| `tags`           | VARCHAR(500) | Теги                               |
| `calories`       | VARCHAR(50)  | Калории                            |
| `protein`        | VARCHAR(50)  | Белки                              |
| `carbs`          | VARCHAR(50)  | Углеводы                           |
| `fat`            | VARCHAR(50)  | Жиры                               |
| `notes`          | TEXT         | Заметки                            |
| `views_count`    | INT          | Счётчик просмотров                 |
| `created_at`     | TIMESTAMP    | Дата создания                      |
| `updated_at`     | TIMESTAMP    | Дата обновления                    |

### Таблица `favorites` (Избранное)

| Поле         | Тип       | Описание                          |
|--------------|-----------|-----------------------------------|
| `id`         | SERIAL    | Первичный ключ                    |
| `user_id`    | INT (FK)  | Внешний ключ → `users(id)`        |
| `recipe_id`  | INT (FK)  | Внешний ключ → `recipes(id)`      |
| `created_at` | TIMESTAMP | Дата добавления в избранное       |

---

## 🔗 Архитектура связей

### Ключевой принцип: данные автора НЕ копируются в recipes

```
┌─────────────┐              ┌──────────────────┐
│   users     │              │    recipes       │
├─────────────┤              ├──────────────────┤
│ id          │◄──────┐      │ id               │
│ username    │       │      │ author_id (FK)───┼─── Ссылка на users.id
│ avatar_url  │       │      │ title            │
│ email       │       └──────┤ description      │
│ ...         │   JOIN       │ ...              │
└─────────────┘              └──────────────────┘
```

**Как это работает:**
1. При создании рецепта указывается только `author_id` (ID автора из JWT)
2. При запросе рецептов выполняется `INNER JOIN users ON recipes.author_id = users.id`
3. Если пользователь меняет `username` или `avatar_url` в своём профиле:
   - Изменения **мгновенно** видны во всех его рецептах
   - **Не нужно** обновлять данные в таблице recipes
   - **Нет дублирования** данных

**SQL-запрос для получения рецептов с данными автора:**
```sql
SELECT 
  r.*,
  u.id AS author_id,
  u.username AS author_username,
  u.avatar_url AS author_avatar_url
FROM recipes r
INNER JOIN users u ON r.author_id = u.id
WHERE r.id = $1;
```

---

## 🔌 API Endpoints

Базовый URL: `http://localhost:5000/api`

### Авторизация

#### `POST /auth/register` — Регистрация
**Доступ:** Публичный

**Body:**
```json
{
  "username": "MariaChef",
  "email": "maria@example.com",
  "password": "securePassword123"
}
```

**Response (201):**
```json
{
  "message": "Регистрация успешна",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "MariaChef",
    "email": "maria@example.com",
    "avatar_url": "https://ui-avatars.com/api/?...",
    "bio": ""
  }
}
```

#### `POST /auth/login` — Вход
**Доступ:** Публичный

**Body:**
```json
{
  "email": "maria@example.com",
  "password": "securePassword123"
}
```

**Response (200):**
```json
{
  "message": "Вход выполнен успешно",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "MariaChef",
    "email": "maria@example.com",
    "avatar_url": "https://ui-avatars.com/api/?...",
    "bio": ""
  }
}
```

---

### Пользователи

#### `GET /users/me` — Мой профиль
**Доступ:** 🔒 Требуется JWT

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "user": {
    "id": 1,
    "username": "MariaChef",
    "email": "maria@example.com",
    "avatar_url": "https://example.com/avatar.jpg",
    "bio": "Люблю итальянскую кухню",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-20T14:00:00Z"
  }
}
```

#### `PATCH /users/me` — Обновить профиль
**Доступ:** 🔒 Требуется JWT

**Headers:** `Authorization: Bearer <token>`

**Body (любые поля):**
```json
{
  "username": "NewName",
  "avatar_url": "https://example.com/new-avatar.jpg",
  "bio": "Обновлённое описание"
}
```

**Response (200):**
```json
{
  "message": "Профиль обновлён",
  "user": {
    "id": 1,
    "username": "NewName",
    "email": "maria@example.com",
    "avatar_url": "https://example.com/new-avatar.jpg",
    "bio": "Обновлённое описание",
    "updated_at": "2024-01-20T14:00:00Z"
  }
}
```

#### `GET /users/:id` — Публичный профиль
**Доступ:** Публичный

**Response (200):**
```json
{
  "user": {
    "id": 1,
    "username": "MariaChef",
    "avatar_url": "https://example.com/avatar.jpg",
    "bio": "Люблю итальянскую кухню"
  },
  "recipes": [
    {
      "id": 5,
      "title": "Паста Карбонара",
      "description": "Классический итальянский рецепт",
      "image_url": "https://example.com/pasta.jpg",
      "author_id": 1,
      "author_username": "MariaChef",
      "author_avatar_url": "https://example.com/avatar.jpg",
      "created_at": "2024-01-18T12:00:00Z"
    }
  ]
}
```

---

### Рецепты

#### `GET /recipes` — Список рецептов
**Доступ:** Публичный

**Query параметры:**
- `limit` (число, по умолчанию 20) — количество рецептов
- `offset` (число, по умолчанию 0) — смещение для пагинации
- `category` (строка) — фильтр по категории
- `search` (строка) — поиск по названию и описанию

**Response (200):**
```json
{
  "recipes": [
    {
      "id": 5,
      "title": "Паста Карбонара",
      "description": "Классический итальянский рецепт",
      "image_url": "https://example.com/pasta.jpg",
      "time": "25 мин",
      "difficulty": "Средняя",
      "category": "🍝 Основные блюда",
      "servings": 4,
      "views_count": 142,
      "created_at": "2024-01-18T12:00:00Z",
      "author_id": 1,
      "author_username": "MariaChef",
      "author_avatar_url": "https://example.com/avatar.jpg",
      "is_favorite": false
    }
  ],
  "total": 47,
  "pagination": {
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

#### `GET /recipes/:id` — Один рецепт
**Доступ:** Публичный

**Response (200):**
```json
{
  "recipe": {
    "id": 5,
    "title": "Паста Карбонара",
    "description": "Классический итальянский рецепт",
    "full_description": "Подробное описание...",
    "image_url": "https://example.com/pasta.jpg",
    "ingredients": ["500г спагетти", "200г бекона", "4 яйца", "100г пармезана"],
    "instructions": "Шаг 1...\nШаг 2...",
    "time": "25 мин",
    "difficulty": "Средняя",
    "category": "🍝 Основные блюда",
    "servings": 4,
    "author_id": 1,
    "author_username": "MariaChef",
    "author_avatar_url": "https://example.com/avatar.jpg",
    "is_favorite": true
  }
}
```

#### `POST /recipes` — Создать рецепт
**Доступ:** 🔒 Требуется JWT

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "title": "Тирамису",
  "description": "Итальянский десерт",
  "full_description": "Подробный рецепт...",
  "image_url": "https://example.com/tiramisu.jpg",
  "ingredients": ["500г маскарпоне", "6 яиц", "200г савоярди", "300мл эспрессо"],
  "instructions": "Шаг 1...\nШаг 2...\nШаг 3...",
  "time": "40 мин",
  "difficulty": "Сложная",
  "category": "🍰 Десерт",
  "servings": 8,
  "tags": "итальянский, десерт, кофе",
  "calories": "450",
  "protein": "8",
  "carbs": "55",
  "fat": "22"
}
```

**Response (201):**
```json
{
  "message": "Рецепт опубликован",
  "recipe": {
    "id": 10,
    "title": "Тирамису",
    "author_id": 1,
    "author_username": "MariaChef",
    "author_avatar_url": "https://example.com/avatar.jpg",
    "created_at": "2024-01-20T15:00:00Z"
  }
}
```

#### `DELETE /recipes/:id` — Удалить рецепт
**Доступ:** 🔒 Требуется JWT (только автор может удалить)

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "message": "Рецепт удалён"
}
```

---

### Избранное

#### `POST /recipes/:id/favorite` — Toggle избранного
**Доступ:** 🔒 Требуется JWT

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "message": "Рецепт добавлен в избранное",
  "action": "added"
}
```

При повторном запросе:
```json
{
  "message": "Рецепт удалён из избранного",
  "action": "removed"
}
```

#### `GET /users/me/favorites` — Мои избранные рецепты
**Доступ:** 🔒 Требуется JWT

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "favorites": [
    {
      "id": 5,
      "title": "Паста Карбонара",
      "description": "Классический итальянский рецепт",
      "image_url": "https://example.com/pasta.jpg",
      "author_id": 1,
      "author_username": "MariaChef",
      "author_avatar_url": "https://example.com/avatar.jpg",
      "favorited_at": "2024-01-19T10:00:00Z"
    }
  ],
  "total": 3
}
```

---

## 🚀 Установка и запуск

### 1. Установи PostgreSQL

Убедись, что PostgreSQL запущен и доступен.

### 2. Настрой .env

Скопируй `.env.example` в `.env` и настрой подключение к БД:

```bash
cd backend
cp .env.example .env
```

Отредактируй `.env`:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=flavorfusion
DB_USER=postgres
DB_PASSWORD=твой_пароль
JWT_SECRET=произвольная_строка
```

### 3. Установи зависимости

```bash
npm install
```

### 4. Создай базу данных

```bash
# В PostgreSQL
CREATE DATABASE flavorfusion;
```

### 5. Запусти миграцию

```bash
npm run db:migrate
```

### 6. Запусти сервер

```bash
# Development (с автоперезапуском)
npm run dev

# Production
npm start
```

Сервер будет доступен на `http://localhost:5000`

---

## 💡 Примеры запросов (cURL)

### Регистрация
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"MariaChef","email":"maria@example.com","password":"secure12345"}'
```

### Вход
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"maria@example.com","password":"secure12345"}'
```

### Получить рецепты (публичный)
```bash
curl http://localhost:5000/api/recipes?limit=10&offset=0
```

### Создать рецепт (защищённый)
```bash
curl -X POST http://localhost:5000/api/recipes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"title":"Мой рецепт","description":"Описание","ingredients":["ингредиент1"],"instructions":"Шаг 1","time":"30 мин"}'
```

### Обновить профиль (защищённый)
```bash
curl -X PATCH http://localhost:5000/api/users/me \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"username":"NewName","avatar_url":"https://example.com/new.jpg"}'
```

### Добавить в избранное (защищённый)
```bash
curl -X POST http://localhost:5000/api/recipes/5/favorite \
  -H "Authorization: Bearer <TOKEN>"
```

---

## 📁 Структура проекта

```
backend/
├── controllers/        # Логика обработки запросов
│   ├── authController.js
│   ├── userController.js
│   ├── recipeController.js
│   └── favoriteController.js
├── database/           # Настройка БД
│   ├── pool.js         # Pool подключений
│   ├── schema.sql      # SQL-схема таблиц
│   └── migrate.js      # Скрипт миграции
├── middleware/         # Промежуточные обработчики
│   └── auth.js         # JWT middleware
├── models/             # Модели данных
│   ├── User.js
│   ├── Recipe.js
│   └── Favorite.js
├── routes/             # Маршруты
│   ├── auth.js
│   ├── users.js
│   └── recipes.js
├── .env                # Переменные окружения
├── .env.example        # Шаблон .env
├── .gitignore
├── package.json
└── server.js           # Точка входа
```
