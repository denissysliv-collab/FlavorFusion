/**
 * Контроллер авторизации
 * Регистрация, вход, генерация JWT
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_change_this_in_production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Генерация JWT-токена
 */
function generateToken(user) {
  return jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

const authController = {
  /**
   * POST /api/auth/register
   * Регистрация нового пользователя
   * Body: { username, email, password }
   */
  async register(req, res, next) {
    try {
      const { username, email, password } = req.body;

      // Проверяем, не занят ли email
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(409).json({ error: 'Этот email уже зарегистрирован' });
      }

      // Создаём пользователя (роль по умолчанию 'user')
      const user = await User.create({ username, email, password, role: 'user' });

      // Генерируем токен
      const token = generateToken(user);

      res.status(201).json({
        message: 'Регистрация успешна',
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          avatar_url: user.avatar_url,
          bio: user.bio,
          role: user.role,
          status: user.status,
        },
      });
    } catch (err) {
      // Уникальность username/email
      if (err.code === '23505') {
        if (err.constraint?.includes('username')) {
          return res.status(409).json({ error: 'Это имя пользователя уже занято' });
        }
      }
      next(err);
    }
  },

  /**
   * POST /api/auth/login
   * Вход пользователя
   * Body: { email, password }
   */
  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      // Ищем пользователя
      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(401).json({ error: 'Неверный email или пароль' });
      }

      // Проверяем пароль
      const isValid = await User.verifyPassword(password, user.password_hash);
      if (!isValid) {
        return res.status(401).json({ error: 'Неверный email или пароль' });
      }

      // Проверяем статус
      if (user.status === 'banned') {
        return res.status(403).json({ error: 'Ваш аккаунт заблокирован' });
      }

      // Генерируем токен
      const token = generateToken(user);

      res.json({
        message: 'Вход выполнен успешно',
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          avatar_url: user.avatar_url,
          bio: user.bio,
          role: user.role,
          status: user.status,
        },
      });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = authController;
