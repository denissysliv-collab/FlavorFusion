/**
 * Middleware для проверки прав администратора
 * 
 * Логика:
 * 1. Проверяет, что пользователь авторизован (req.user существует)
 * 2. Проверяет, что роль пользователя === 'admin'
 * 3. Если нет — возвращает 403 Forbidden
 * 
 * Использование:
 *   - Для защищённых админ-маршрутов: authorizeAdmin(req, res, next)
 */

const pool = require('../database/pool');

async function authorizeAdmin(req, res, next) {
  try {
    // Проверяем, что пользователь авторизован
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Требуется авторизация' });
    }

    // Получаем роль пользователя из БД
    const result = await pool.query(
      'SELECT role, status FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    const { role, status } = result.rows[0];

    // Проверяем статус
    if (status === 'banned') {
      return res.status(403).json({ error: 'Аккаунт заблокирован' });
    }

    // Проверяем роль
    if (role !== 'admin') {
      return res.status(403).json({ error: 'Доступ запрещён. Требуются права администратора.' });
    }

    // Добавляем роль в req.user для дальнейшего использования
    req.user.role = role;
    req.user.status = status;

    next();
  } catch (err) {
    console.error('Ошибка в authorizeAdmin:', err);
    return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
}

module.exports = authorizeAdmin;
