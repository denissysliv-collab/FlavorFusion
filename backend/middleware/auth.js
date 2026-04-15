/**
 * Middleware для проверки JWT-токена
 * 
 * Логика:
 * 1. Извлекаем токен из заголовка Authorization: Bearer <token>
 * 2. Верифицируем токен
 * 3. Если валиден — записываем user.id в req.user и передаём управление дальше
 * 4. Если невалиден — возвращаем 401
 * 
 * Использование:
 *   - Для защищённых маршрутов: authMiddleware(req, res, next)
 *   - Для опциональной аутентификации: authMiddleware.optional(req, res, next)
 */

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_change_this_in_production';

/** Обязательная аутентификация */
function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    // Проверяем наличие заголовка
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Токен не предоставлен. Войдите в систему.' });
    }

    // Извлекаем токен
    const token = authHeader.split(' ')[1];

    // Верифицируем токен
    const decoded = jwt.verify(token, JWT_SECRET);

    // Записываем ID пользователя в запрос
    req.user = { id: decoded.id };

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Токен истёк. Войдите заново.' });
    }
    return res.status(401).json({ error: 'Недействительный токен' });
  }
}

/** Опциональная аутентификация: если токена нет — не ошибка */
authMiddleware.optional = function (req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = { id: decoded.id };
    }
    // Если токена нет или он невалиден — просто продолжаем без req.user
    next();
  } catch {
    next();
  }
};

module.exports = authMiddleware;
