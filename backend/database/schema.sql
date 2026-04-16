-- ============================================
-- СХЕМА БАЗЫ ДАННЫХ FLAVORFUSION
-- ============================================
-- Архитектура: данные автора (имя, аватар) 
-- НЕ копируются в recipes, а подтягиваются 
-- через JOIN по author_id. Это гарантирует, 
-- что при изменении профиля автора изменения 
-- мгновенно отражаются во всех его рецептах.
-- ============================================

-- Таблица пользователей
CREATE TABLE IF NOT EXISTS users (
    id              SERIAL PRIMARY KEY,
    username        VARCHAR(50)  NOT NULL UNIQUE,
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    avatar_url      TEXT         DEFAULT 'https://ui-avatars.com/api/?background=FF6B6B&color=fff&name=U',
    bio             TEXT         DEFAULT '',
    role            VARCHAR(20)  DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    status          VARCHAR(20)  DEFAULT 'active' CHECK (status IN ('active', 'banned')),
    created_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- Таблица рецептов
-- author_id — строго внешний ключ на users(id).
-- Данные автора (username, avatar_url) подтягиваются через JOIN.
CREATE TABLE IF NOT EXISTS recipes (
    id              SERIAL PRIMARY KEY,
    author_id       INT          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title           VARCHAR(255) NOT NULL,
    description     TEXT         NOT NULL,
    full_description TEXT        DEFAULT '',
    image_url       TEXT         DEFAULT '',
    ingredients     JSONB        NOT NULL DEFAULT '[]',   -- массив строк
    instructions    TEXT         NOT NULL,
    time            VARCHAR(50)  NOT NULL,                -- например "30 минут"
    difficulty      VARCHAR(50)  DEFAULT 'Средняя',
    category        VARCHAR(100) DEFAULT '',
    servings        INT          DEFAULT 4,
    tags            VARCHAR(500) DEFAULT '',
    calories        VARCHAR(50)  DEFAULT '',
    protein         VARCHAR(50)  DEFAULT '',
    carbs           VARCHAR(50)  DEFAULT '',
    fat             VARCHAR(50)  DEFAULT '',
    notes           TEXT         DEFAULT '',
    views_count     INT          DEFAULT 0,
    created_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- Таблица избранного (многие-ко-многим)
CREATE TABLE IF NOT EXISTS favorites (
    id              SERIAL PRIMARY KEY,
    user_id         INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipe_id       INT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Один пользователь может добавить рецепт в избранное только один раз
    UNIQUE(user_id, recipe_id)
);

-- Таблица лайков на рецепты (многие-ко-многим)
CREATE TABLE IF NOT EXISTS likes (
    id              SERIAL PRIMARY KEY,
    user_id         INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipe_id       INT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Один пользователь может лайкнуть рецепт только один раз
    UNIQUE(user_id, recipe_id)
);

-- Таблица подписок (многие-ко-многим: пользователь → автор)
CREATE TABLE IF NOT EXISTS subscriptions (
    id              SERIAL PRIMARY KEY,
    follower_id     INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,  -- кто подписался
    following_id    INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,  -- на кого подписался
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Нельзя подписаться дважды на одного автора
    UNIQUE(follower_id, following_id),
    -- Нельзя подписаться на самого себя
    CHECK (follower_id != following_id)
);

-- Индексы для ускорения запросов
CREATE INDEX IF NOT EXISTS idx_recipes_author_id    ON recipes(author_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user_id    ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_recipe_id  ON favorites(recipe_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id        ON likes(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_recipe_id      ON likes(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipes_category      ON recipes(category);
CREATE INDEX IF NOT EXISTS idx_recipes_created_at    ON recipes(created_at DESC);

-- Таблица активности пользователя
CREATE TABLE IF NOT EXISTS activity_log (
    id              SERIAL PRIMARY KEY,
    user_id         INT          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action          VARCHAR(50)  NOT NULL,  -- 'recipe_created', 'recipe_updated', 'recipe_deleted', 'recipe_favorited', 'recipe_unfavorited'
    recipe_id       INT          REFERENCES recipes(id) ON DELETE SET NULL,
    recipe_title    VARCHAR(255) DEFAULT '',
    created_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_activity_user_id   ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_created   ON activity_log(created_at DESC);

-- Функция автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггеры для автоматического обновления updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_recipes_updated_at ON recipes;

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recipes_updated_at
    BEFORE UPDATE ON recipes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
