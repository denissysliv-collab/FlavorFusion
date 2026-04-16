/**
 * Контроллер администратора
 * 
 * Функции:
 *   - GET /api/admin/stats — статистика платформы
 *   - GET /api/admin/users — все пользователи
 *   - PATCH /api/admin/users/:id/status — изменить статус (active/banned)
 *   - PATCH /api/admin/users/:id/role — изменить роль (user/admin)
 */

const pool = require('../database/pool');
const Recipe = require('../models/Recipe');
const Like = require('../models/Like');
const Favorite = require('../models/Favorite');

const adminController = {
  /**
   * GET /api/admin/stats
   * Получить общую статистику платформы
   */
  async getStats(req, res, next) {
    try {
      // Считаем пользователей
      const usersResult = await pool.query('SELECT COUNT(*) FROM users');
      const totalUsers = parseInt(usersResult.rows[0].count);

      // Считаем рецепты
      const recipesResult = await pool.query('SELECT COUNT(*) FROM recipes');
      const totalRecipes = parseInt(recipesResult.rows[0].count);

      // Считаем лайки
      const likesResult = await pool.query('SELECT COUNT(*) FROM likes');
      const totalLikes = parseInt(likesResult.rows[0].count);

      // Считаем избранные
      const favoritesResult = await pool.query('SELECT COUNT(*) FROM favorites');
      const totalFavorites = parseInt(favoritesResult.rows[0].count);

      // Активные пользователи
      const activeUsersResult = await pool.query("SELECT COUNT(*) FROM users WHERE status = 'active'");
      const activeUsers = parseInt(activeUsersResult.rows[0].count);

      // Заблокированные пользователи
      const bannedUsersResult = await pool.query("SELECT COUNT(*) FROM users WHERE status = 'banned'");
      const bannedUsers = parseInt(bannedUsersResult.rows[0].count);

      // Администраторы
      const adminsResult = await pool.query("SELECT COUNT(*) FROM users WHERE role = 'admin'");
      const totalAdmins = parseInt(adminsResult.rows[0].count);

      res.json({
        stats: {
          totalUsers,
          activeUsers,
          bannedUsers,
          totalAdmins,
          totalRecipes,
          totalLikes,
          totalFavorites,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/admin/users
   * Получить всех пользователей с их статистикой
   * Query: ?limit=20&offset=0&search=...&status=...
   */
  async getAllUsers(req, res, next) {
    try {
      const limit = parseInt(req.query.limit) || 20;
      const offset = parseInt(req.query.offset) || 0;
      const { search, status } = req.query;

      // Базовый запрос
      let baseQuery = `
        FROM users u
        LEFT JOIN recipes r ON u.id = r.author_id
        WHERE 1=1
      `;
      const values = [];
      let paramIndex = 1;

      // Фильтр по поиску
      if (search) {
        baseQuery += ` AND (u.username ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex})`;
        values.push(`%${search}%`);
        paramIndex++;
      }

      // Фильтр по статусу
      if (status && ['active', 'banned'].includes(status)) {
        baseQuery += ` AND u.status = $${paramIndex}`;
        values.push(status);
        paramIndex++;
      }

      // Счётчик
      const countQuery = `SELECT COUNT(DISTINCT u.id) ${baseQuery}`;
      const countResult = await pool.query(countQuery, values);
      const total = parseInt(countResult.rows[0].count);

      // Основные данные с пагинацией
      values.push(limit, offset);

      const usersResult = await pool.query(
        `SELECT 
          u.id,
          u.username,
          u.email,
          u.avatar_url,
          u.bio,
          u.role,
          u.status,
          u.created_at,
          COUNT(DISTINCT r.id) AS recipes_count
         ${baseQuery}
         GROUP BY u.id
         ORDER BY u.created_at DESC
         LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        values
      );

      res.json({
        users: usersResult.rows,
        total,
        pagination: {
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * PATCH /api/admin/users/:id/status
   * Изменить статус пользователя (active/banned)
   */
  async updateUserStatus(req, res, next) {
    try {
      const userId = parseInt(req.params.id);
      const { status } = req.body;

      // Валидация
      if (!status || !['active', 'banned'].includes(status)) {
        return res.status(400).json({ error: 'Статус должен быть "active" или "banned"' });
      }

      // Нельзя заблокировать самого себя
      if (userId === req.user.id) {
        return res.status(400).json({ error: 'Нельзя изменить собственный статус' });
      }

      const result = await pool.query(
        'UPDATE users SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, username, email, status, role',
        [status, userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Пользователь не найден' });
      }

      res.json({
        message: `Статус пользователя изменён на "${status}"`,
        user: result.rows[0],
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * PATCH /api/admin/users/:id/role
   * Изменить роль пользователя (user/admin)
   */
  async updateUserRole(req, res, next) {
    try {
      const userId = parseInt(req.params.id);
      const { role } = req.body;

      // Валидация
      if (!role || !['user', 'admin'].includes(role)) {
        return res.status(400).json({ error: 'Роль должна быть "user" или "admin"' });
      }

      // Нельзя понизить собственного админа
      if (userId === req.user.id && role === 'user') {
        return res.status(400).json({ error: 'Нельзя снять с себя права администратора' });
      }

      const result = await pool.query(
        'UPDATE users SET role = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, username, email, role, status',
        [role, userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Пользователь не найден' });
      }

      res.json({
        message: `Роль пользователя изменена на "${role}"`,
        user: result.rows[0],
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * DELETE /api/admin/users/:id
   * Удалить пользователя (только админ может)
   */
  async deleteUser(req, res, next) {
    try {
      const userId = parseInt(req.params.id);

      // Нельзя удалить самого себя
      if (userId === req.user.id) {
        return res.status(400).json({ error: 'Нельзя удалить собственную учётную запись' });
      }

      const result = await pool.query(
        'DELETE FROM users WHERE id = $1 RETURNING id, username',
        [userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Пользователь не найден' });
      }

      res.json({
        message: `Пользователь "${result.rows[0].username}" удалён`,
      });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = adminController;
