/**
 * Модель Like — лайки на рецепты
 */

const pool = require('../database/pool');

const Like = {
  /**
   * Поставить/убрать лайк рецепту
   */
  async toggle(userId, recipeId) {
    const exists = await pool.query(
      'SELECT id FROM likes WHERE user_id = $1 AND recipe_id = $2',
      [userId, recipeId]
    );

    if (exists.rows.length > 0) {
      await pool.query(
        'DELETE FROM likes WHERE user_id = $1 AND recipe_id = $2',
        [userId, recipeId]
      );
      return { action: 'removed' };
    } else {
      await pool.query(
        'INSERT INTO likes (user_id, recipe_id) VALUES ($1, $2)',
        [userId, recipeId]
      );
      return { action: 'added' };
    }
  },

  /**
   * Общее количество лайков у всех рецептов автора
   */
  async countAuthorLikes(authorId) {
    const result = await pool.query(
      `SELECT COUNT(*) FROM likes l
       INNER JOIN recipes r ON l.recipe_id = r.id
       WHERE r.author_id = $1`,
      [authorId]
    );
    return parseInt(result.rows[0].count);
  },

  /**
   * Количество лайков у конкретного рецепта
   */
  async countRecipe(recipeId) {
    const result = await pool.query(
      'SELECT COUNT(*) FROM likes WHERE recipe_id = $1',
      [recipeId]
    );
    return parseInt(result.rows[0].count);
  },

  /**
   * Поставил ли пользователь лайк рецепту
   */
  async isLiked(userId, recipeId) {
    const result = await pool.query(
      'SELECT id FROM likes WHERE user_id = $1 AND recipe_id = $2',
      [userId, recipeId]
    );
    return result.rows.length > 0;
  },

  /**
   * Получить все рецепты, лайкнутые пользователем, с данными авторов (JOIN)
   */
  async findLikedByUser(userId) {
    const result = await pool.query(
      `SELECT r.*,
        u.id AS author_id,
        u.username AS author_username,
        u.avatar_url AS author_avatar_url,
        l.created_at AS liked_at
       FROM likes l
       INNER JOIN recipes r ON l.recipe_id = r.id
       INNER JOIN users u ON r.author_id = u.id
       WHERE l.user_id = $1
       ORDER BY l.created_at DESC`,
      [userId]
    );
    return result.rows;
  },
};

module.exports = Like;
