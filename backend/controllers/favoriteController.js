/**
 * Контроллер избранного
 * POST /api/recipes/:id/favorite — toggle (добавить/удалить)
 * GET  /api/users/me/favorites   — список избранных рецептов
 */

const Favorite = require('../models/Favorite');
const Recipe = require('../models/Recipe');
const Activity = require('../models/Activity');

const favoriteController = {
  /**
   * POST /api/recipes/:id/favorite
   * Защищённый: добавить/удалить рецепт из избранного (toggle)
   */
  async toggle(req, res, next) {
    try {
      const recipeId = parseInt(req.params.id);

      // Проверяем, что рецепт существует
      const recipe = await Recipe.findById(recipeId);
      if (!recipe) {
        return res.status(404).json({ error: 'Рецепт не найден' });
      }

      const result = await Favorite.toggle(req.user.id, recipeId);

      // Логируем активность
      const action = result.action === 'added' ? 'recipe_favorited' : 'recipe_unfavorited';
      Activity.log(req.user.id, action, recipeId, recipe.title);

      res.json({
        message:
          result.action === 'added'
            ? 'Рецепт добавлен в избранное'
            : 'Рецепт удалён из избранного',
        action: result.action,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/users/me/favorites
   * Защищённый: получить все избранные рецепты с данными авторов
   * (данные автора подтягиваются через JOIN — всегда актуальны)
   */
  async getMyFavorites(req, res, next) {
    try {
      const favorites = await Favorite.findByUserId(req.user.id);

      res.json({
        favorites,
        total: favorites.length,
      });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = favoriteController;
