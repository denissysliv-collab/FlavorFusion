/**
 * Модель Favorite
 * 
 * Управляет избранными рецептами пользователей.
 * Связь многие-ко-многим через таблицу favorites(user_id, recipe_id).
 * При запросе избранного JOIN подтягивает актуальные данные автора.
 */

const pool = require('../database/pool');

const Favorite = {
  /**
   * Добавить рецепт в избранное
   * @returns {object} созданная запись или null если уже существует
   */
  async add(userId, recipeId) {
    try {
      const result = await pool.query(
        'INSERT INTO favorites (user_id, recipe_id) VALUES ($1, $2) RETURNING *',
        [userId, recipeId]
      );
      return result.rows[0];
    } catch (err) {
      // Если запись уже есть (unique violation) — игнорируем
      if (err.code === '23505') {
        return null;
      }
      throw err;
    }
  },

  /**
   * Удалить рецепт из избранного (toggle-логика)
   * @returns {boolean} true если удалено, false если не было в избранном
   */
  async remove(userId, recipeId) {
    const result = await pool.query(
      'DELETE FROM favorites WHERE user_id = $1 AND recipe_id = $2 RETURNING id',
      [userId, recipeId]
    );
    return result.rows.length > 0;
  },

  /**
   * Toggle: добавить если нет, удалить если есть
   * @returns {{ action: 'added'|'removed' }}
   */
  async toggle(userId, recipeId) {
    const exists = await pool.query(
      'SELECT id FROM favorites WHERE user_id = $1 AND recipe_id = $2',
      [userId, recipeId]
    );

    if (exists.rows.length > 0) {
      await this.remove(userId, recipeId);
      return { action: 'removed' };
    } else {
      await this.add(userId, recipeId);
      return { action: 'added' };
    }
  },

  /**
   * Получить все избранные рецепты пользователя с данными авторов (JOIN)
   */
  async findByUserId(userId) {
    const result = await pool.query(
      `SELECT 
        r.*,
        u.id AS author_id,
        u.username AS author_username,
        u.avatar_url AS author_avatar_url,
        f.created_at AS favorited_at
       FROM favorites f
       INNER JOIN recipes r ON f.recipe_id = r.id
       INNER JOIN users u ON r.author_id = u.id
       WHERE f.user_id = $1
       ORDER BY f.created_at DESC`,
      [userId]
    );
    return result.rows;
  },

  /**
   * Проверить, находится ли рецепт в избранном у пользователя
   */
  async isFavorite(userId, recipeId) {
    const result = await pool.query(
      'SELECT id FROM favorites WHERE user_id = $1 AND recipe_id = $2',
      [userId, recipeId]
    );
    return result.rows.length > 0;
  },

  /**
   * Общее количество добавлений рецептов автора в избранное другими пользователями
   */
  async countAuthorFavorites(authorId) {
    const result = await pool.query(
      `SELECT COUNT(*) FROM favorites f
       INNER JOIN recipes r ON f.recipe_id = r.id
       WHERE r.author_id = $1`,
      [authorId]
    );
    return parseInt(result.rows[0].count);
  },
};

module.exports = Favorite;
