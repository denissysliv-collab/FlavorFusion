/**
 * Модель User
 * 
 * Все операции с пользователями:
 *  - регистрация, вход
 *  - получение профиля (публично)
 *  - обновление имени и аватара
 * 
 * ВАЖНО: username и avatar_url НЕ копируются в recipes.
 * Рецепты подтягивают данные автора через JOIN по author_id.
 */

const pool = require('../database/pool');
const bcrypt = require('bcrypt');

const User = {
  /**
   * Создать нового пользователя
   * @param {string} username
   * @param {string} email
   * @param {string} password
   * @returns {object} созданный пользователь (без password_hash)
   */
  async create({ username, email, password }) {
    // Хешируем пароль (10 раундов salt)
    const passwordHash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, username, email, avatar_url, bio, created_at`,
      [username, email, passwordHash]
    );

    return result.rows[0];
  },

  /**
   * Найти пользователя по email
   */
  async findByEmail(email) {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0];
  },

  /**
   * Найти пользователя по ID (без пароля)
   */
  async findById(id) {
    const result = await pool.query(
      `SELECT id, username, email, avatar_url, bio, created_at, updated_at
       FROM users WHERE id = $1`,
      [id]
    );
    return result.rows[0];
  },

  /**
   * Обновить имя и/или аватар пользователя
   * Изменения автоматически отразятся во всех рецептах автора,
   * так как рецепты подтягивают данные через JOIN.
   * 
   * @param {number} userId
   * @param {object}  data — { username?, avatar_url?, bio? }
   */
  async update(userId, data) {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    // Динамически формируем SET-поля только для переданных значений
    if (data.username !== undefined) {
      fields.push(`username = $${paramIndex++}`);
      values.push(data.username);
    }
    if (data.avatar_url !== undefined) {
      fields.push(`avatar_url = $${paramIndex++}`);
      values.push(data.avatar_url);
    }
    if (data.bio !== undefined) {
      fields.push(`bio = $${paramIndex++}`);
      values.push(data.bio);
    }

    if (fields.length === 0) {
      throw new Error('Нет данных для обновления');
    }

    values.push(userId);

    const result = await pool.query(
      `UPDATE users
       SET ${fields.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING id, username, email, avatar_url, bio, updated_at`,
      values
    );

    return result.rows[0];
  },

  /**
   * Проверить пароль
   */
  async verifyPassword(password, hash) {
    return bcrypt.compare(password, hash);
  },
};

module.exports = User;
