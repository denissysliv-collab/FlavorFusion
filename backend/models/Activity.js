/**
 * Модель Activity
 * Логирование действий пользователя и уведомления
 */

const pool = require('../database/pool');

const Activity = {
  /**
   * Записать действие в лог
   */
  async log(userId, action, recipeId = null, recipeTitle = '') {
    await pool.query(
      `INSERT INTO activity_log (user_id, action, recipe_id, recipe_title)
       VALUES ($1, $2, $3, $4)`,
      [userId, action, recipeId, recipeTitle]
    );
  },

  /**
   * Получить активность пользователя
   */
  async getUserActivity(userId, limit = 50) {
    const result = await pool.query(
      `SELECT id, user_id, action, recipe_id, recipe_title, created_at
       FROM activity_log
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [userId, limit]
    );
    return result.rows;
  },

  /**
   * Получить уведомления о новых рецептах от авторов, на которых подписан пользователь
   */
  async getRecipeNotifications(userId, limit = 20) {
    const result = await pool.query(
      `SELECT al.id, al.recipe_id, al.recipe_title, al.created_at,
        r.author_id, u.username AS author_username, u.avatar_url AS author_avatar_url
       FROM activity_log al
       INNER JOIN recipes r ON al.recipe_id = r.id
       INNER JOIN users u ON r.author_id = u.id
       WHERE al.action = 'recipe_created'
         AND r.author_id IN (
           SELECT following_id FROM subscriptions WHERE follower_id = $1
         )
       ORDER BY al.created_at DESC
       LIMIT $2`,
      [userId, limit]
    );
    return result.rows;
  },

  /**
   * Отправить уведомления всем подписчикам автора о новом рецепте
   */
  async notifyFollowers(authorId, recipeId, recipeTitle) {
    // Находим всех подписчиков автора
    const followers = await pool.query(
      'SELECT follower_id FROM subscriptions WHERE following_id = $1',
      [authorId]
    );

    // Для каждого подписчика создаём запись в activity_log
    const promises = followers.rows.map(row =>
      this.log(row.follower_id, 'recipe_created', recipeId, recipeTitle)
    );

    await Promise.all(promises);
    return followers.rows.length;
  },
};

module.exports = Activity;
