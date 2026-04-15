/**
 * Маршруты рецептов
 *
 * Публичные (доступны без авторизации):
 *   GET    /api/recipes          — список всех рецептов
 *   GET    /api/recipes/:id      — один рецепт
 *
 * Защищённые (нужен JWT):
 *   POST   /api/recipes          — создать рецепт
 *   PATCH  /api/recipes/:id      — обновить свой рецепт
 *   DELETE /api/recipes/:id      — удалить свой рецепт
 *   POST   /api/recipes/:id/favorite — добавить/удалить из избранного
 */

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const recipeController = require('../controllers/recipeController');
const favoriteController = require('../controllers/favoriteController');
const Like = require('../models/Like');

// === Публичные маршруты (доступны всем) ===

// Список рецептов с пагинацией и фильтрацией
// authMiddleware.optional — если токен есть, добавим isFavorite
router.get('/', authMiddleware.optional, recipeController.getAll);

// Один рецепт
router.get('/:id', authMiddleware.optional, recipeController.getById);

// === Защищённые маршруты (нужен JWT) ===

// Создать рецепт
router.post('/', authMiddleware, recipeController.create);

// Обновить свой рецепт
router.patch('/:id', authMiddleware, recipeController.updateRecipe);

// Удалить свой рецепт
router.delete('/:id', authMiddleware, recipeController.deleteRecipe);

// Добавить/удалить из избранного (toggle)
router.post('/:id/favorite', authMiddleware, favoriteController.toggle);

// Лайк рецепта (toggle)
router.post('/:id/like', authMiddleware, async (req, res, next) => {
  try {
    const result = await Like.toggle(req.user.id, parseInt(req.params.id));
    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
