/**
 * Контроллер пользователей
 * Получение и обновление профиля
 */

const User = require('../models/User');
const Recipe = require('../models/Recipe');
const Like = require('../models/Like');
const Favorite = require('../models/Favorite');
const Subscription = require('../models/Subscription');

const userController = {
  /**
   * GET /api/users/me
   * Получить данные текущего пользователя + его рецепты (защищённый)
   */
  async getMe(req, res, next) {
    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ error: 'Пользователь не найден' });
      }

      // Получаем рецепты пользователя
      const recipes = await Recipe.findByAuthorId(req.user.id);

      // Считаем общее количество лайков на все рецепты автора
      const totalLikes = await Like.countAuthorLikes(req.user.id);

      // Считаем сколько раз рецепты автора были добавлены в избранное другими пользователями
      const totalFavorites = await Favorite.countAuthorFavorites(req.user.id);

      // Считаем подписчиков и подписки
      const followersCount = await Subscription.countFollowers(req.user.id);
      const followingCount = await Subscription.countFollowing(req.user.id);

      res.json({ user, recipes, totalLikes, totalFavorites, followersCount, followingCount });
    } catch (err) {
      next(err);
    }
  },

  /**
   * PATCH /api/users/me
   * Обновить имя, аватар, био (защищённый)
   * Body: { username?, avatar_url?, bio? }
   * 
   * ВАЖНО: т.к. рецепты подтягивают данные автора через JOIN,
   * изменения тут же отобразятся во всех рецептах пользователя.
   */
  async updateMe(req, res, next) {
    try {
      const { username, avatar_url, bio } = req.body;

      // Валидация: username не должен быть пустым
      if (username !== undefined && username.trim().length < 3) {
        return res.status(400).json({ error: 'Имя должно быть минимум 3 символа' });
      }

      const updatedUser = await User.update(req.user.id, {
        username,
        avatar_url,
        bio,
      });

      res.json({
        message: 'Профиль обновлён',
        user: updatedUser,
      });
    } catch (err) {
      if (err.message === 'Нет данных для обновления') {
        return res.status(400).json({ error: err.message });
      }
      if (err.code === '23505') {
        return res.status(409).json({ error: 'Это имя пользователя уже занято' });
      }
      next(err);
    }
  },

  /**
   * GET /api/users/:id
   * Публичный профиль пользователя + его рецепты
   * Если пользователь авторизован — возвращаем статус подписки
   */
  async getPublicProfile(req, res, next) {
    try {
      const user = await User.findById(req.params.id);
      if (!user) {
        return res.status(404).json({ error: 'Пользователь не найден' });
      }

      // Получаем рецепты автора
      const recipes = await Recipe.findByAuthorId(req.params.id);

      // Считаем подписчиков
      const followersCount = await Subscription.countFollowers(req.params.id);
      const followingCount = await Subscription.countFollowing(req.params.id);

      // Проверяем, подписан ли текущий пользователь
      let isSubscribed = false;
      if (req.user) {
        isSubscribed = await Subscription.isSubscribed(req.user.id, parseInt(req.params.id));
      }

      // Проверяем, это владелец профиля или нет
      const isOwner = req.user && req.user.id === parseInt(req.params.id);

      res.json({
        user,
        recipes,
        isOwner,
        isSubscribed,
        followersCount,
        followingCount,
      });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = userController;
