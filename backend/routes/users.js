/**
 * Маршруты пользователей
 * 
 * Защищённые (нужен JWT):
 *   GET    /api/users/me          — мой профиль
 *   PATCH  /api/users/me          — обновить профиль
 *   GET    /api/users/me/favorites — моё избранное
 * 
 * Публичные:
 *   GET    /api/users/:id         — публичный профиль
 */

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const userController = require('../controllers/userController');
const favoriteController = require('../controllers/favoriteController');
const Activity = require('../models/Activity');
const Like = require('../models/Like');
const Subscription = require('../models/Subscription');

// === Защищённые маршруты (нужен JWT) ===

// Получить данные текущего пользователя
router.get('/me', authMiddleware, userController.getMe);

// Обновить имя, аватар, био
router.patch('/me', authMiddleware, userController.updateMe);

// Получить избранные рецепты
router.get('/me/favorites', authMiddleware, favoriteController.getMyFavorites);

// Получить активность пользователя
router.get('/me/activity', authMiddleware, async (req, res, next) => {
  try {
    const activities = await Activity.getUserActivity(req.user.id);
    res.json({ activities });
  } catch (err) {
    next(err);
  }
});

// Получить лайкнутые пользователем рецепты
router.get('/me/liked-recipes', authMiddleware, async (req, res, next) => {
  try {
    const likedRecipes = await Like.findLikedByUser(req.user.id);
    res.json({ recipes: likedRecipes });
  } catch (err) {
    next(err);
  }
});

// Получить уведомления о новых рецептах от авторов, на которых подписан
router.get('/me/recipe-notifications', authMiddleware, async (req, res, next) => {
  try {
    const notifications = await Activity.getRecipeNotifications(req.user.id);
    res.json({ notifications });
  } catch (err) {
    next(err);
  }
});

// Подписка/отписка (toggle)
router.post('/me/subscribe/:id', authMiddleware, async (req, res, next) => {
  try {
    const followingId = parseInt(req.params.id);
    const result = await Subscription.toggle(req.user.id, followingId);
    res.json(result);
  } catch (err) {
    if (err.message === 'Нельзя подписаться на самого себя') {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
});

// Получить список авторов, на которых подписан пользователь
router.get('/me/following', authMiddleware, async (req, res, next) => {
  try {
    const following = await Subscription.getFollowing(req.user.id);
    res.json({ following });
  } catch (err) {
    next(err);
  }
});

// === Публичные маршруты ===

// Публичный профиль пользователя + его рецепты (с опциональной авторизацией для статуса подписки)
router.get('/:id', authMiddleware.optional, userController.getPublicProfile);

module.exports = router;
