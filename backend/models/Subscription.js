/**
 * Модель Subscription — подписки между пользователями
 */

const pool = require('../database/pool');
const Activity = require('./Activity');

const Subscription = {
  /**
   * Подписаться/отписаться (toggle)
   */
  async toggle(followerId, followingId) {
    if (followerId === followingId) {
      throw new Error('Нельзя подписаться на самого себя');
    }

    const exists = await pool.query(
      'SELECT id FROM subscriptions WHERE follower_id = $1 AND following_id = $2',
      [followerId, followingId]
    );

    if (exists.rows.length > 0) {
      await pool.query(
        'DELETE FROM subscriptions WHERE follower_id = $1 AND following_id = $2',
        [followerId, followingId]
      );
      return { action: 'unsubscribed' };
    } else {
      await pool.query(
        'INSERT INTO subscriptions (follower_id, following_id) VALUES ($1, $2)',
        [followerId, followingId]
      );

      // Логируем активность
      const author = await pool.query(
        'SELECT username FROM users WHERE id = $1',
        [followingId]
      );
      if (author.rows.length > 0) {
        Activity.log(followerId, 'subscribed', null, author.rows[0].username);
      }

      return { action: 'subscribed' };
    }
  },

  /**
   * Подписан ли пользователь на автора
   */
  async isSubscribed(followerId, followingId) {
    const result = await pool.query(
      'SELECT id FROM subscriptions WHERE follower_id = $1 AND following_id = $2',
      [followerId, followingId]
    );
    return result.rows.length > 0;
  },

  /**
   * Количество подписчиков автора
   */
  async countFollowers(userId) {
    const result = await pool.query(
      'SELECT COUNT(*) FROM subscriptions WHERE following_id = $1',
      [userId]
    );
    return parseInt(result.rows[0].count);
  },

  /**
   * Количество подписок пользователя (на кого он подписан)
   */
  async countFollowing(userId) {
    const result = await pool.query(
      'SELECT COUNT(*) FROM subscriptions WHERE follower_id = $1',
      [userId]
    );
    return parseInt(result.rows[0].count);
  },

  /**
   * Получить всех авторов, на которых подписан пользователь
   */
  async getFollowing(userId) {
    const result = await pool.query(
      `SELECT u.id, u.username, u.avatar_url, s.created_at
       FROM subscriptions s
       INNER JOIN users u ON s.following_id = u.id
       WHERE s.follower_id = $1
       ORDER BY s.created_at DESC`,
      [userId]
    );
    return result.rows;
  },

  /**
   * Получить всех подписчиков пользователя
   */
  async getFollowers(userId) {
    const result = await pool.query(
      `SELECT u.id, u.username, u.avatar_url, s.created_at
       FROM subscriptions s
       INNER JOIN users u ON s.follower_id = u.id
       WHERE s.following_id = $1
       ORDER BY s.created_at DESC`,
      [userId]
    );
    return result.rows;
  },
};

module.exports = Subscription;
