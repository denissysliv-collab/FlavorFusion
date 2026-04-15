/**
 * Контроллер рецептов
 * 
 * Публичные:
 *   - GET /api/recipes         — список всех рецептов
 *   - GET /api/recipes/:id     — один рецепт
 *
 * Защищённые (требуют JWT):
 *   - POST /api/recipes        — создать рецепт
 *   - DELETE /api/recipes/:id  — удалить свой рецепт
 */

const Recipe = require('../models/Recipe');
const Favorite = require('../models/Favorite');
const Activity = require('../models/Activity');
const Like = require('../models/Like');

const recipeController = {
  /**
   * GET /api/recipes
   * Публичный: получить список рецептов с данными авторов
   * Query: ?limit=20&offset=0&category=...&search=...
   *
   * Данные автора (username, avatar_url) подтягиваются через JOIN — всегда актуальны!
   */
  async getAll(req, res, next) {
    try {
      const limit = parseInt(req.query.limit) || 20;
      const offset = parseInt(req.query.offset) || 0;
      const { category, search, sort } = req.query;

      const { recipes, total } = await Recipe.findAll({
        limit,
        offset,
        category,
        search,
        sort: sort || 'newest',
      });

      // Если пользователь авторизован — добавляем флаг isFavorite
      let recipesWithFavorite = recipes;
      if (req.user) {
        recipesWithFavorite = await Promise.all(
          recipes.map(async (recipe) => {
            const isFavorite = await Favorite.isFavorite(req.user.id, recipe.id);
            return { ...recipe, is_favorite: isFavorite };
          })
        );
      }

      res.json({
        recipes: recipesWithFavorite,
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
   * GET /api/recipes/:id
   * Публичный: получить один рецепт + данные автора
   */
  async getById(req, res, next) {
    try {
      const recipe = await Recipe.findById(req.params.id);
      if (!recipe) {
        return res.status(404).json({ error: 'Рецепт не найден' });
      }

      // Увеличиваем счётчик просмотров
      await Recipe.incrementViews(req.params.id);

      // Проверяем избранное если авторизован
      let isFavorite = false;
      if (req.user) {
        isFavorite = await Favorite.isFavorite(req.user.id, recipe.id);
      }

      res.json({
        recipe: { ...recipe, is_favorite: isFavorite },
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/recipes
   * Защищённый: создать новый рецепт
   * Тело запроса должно содержать все поля рецепта
   * author_id берётся из JWT-токена
   */
  async create(req, res, next) {
    try {
      const {
        title,
        description,
        full_description,
        image_url,
        ingredients,
        instructions,
        time,
        difficulty,
        category,
        servings,
        tags,
        calories,
        protein,
        carbs,
        fat,
        notes,
      } = req.body;

      // Валидация обязательных полей
      if (!title || !description || !ingredients || !instructions || !time) {
        return res.status(400).json({
          error: 'Обязательные поля: title, description, ingredients, instructions, time',
        });
      }

      const recipe = await Recipe.create({
        author_id: req.user.id, // ID из JWT
        title,
        description,
        full_description,
        image_url,
        ingredients,
        instructions,
        time,
        difficulty,
        category,
        servings,
        tags,
        calories,
        protein,
        carbs,
        fat,
        notes,
      });

      res.status(201).json({
        message: 'Рецепт опубликован',
        recipe,
      });

      // Логируем активность автора
      Activity.log(req.user.id, 'recipe_created', recipe.id, recipe.title);

      // Отправляем уведомления всем подписчикам автора
      Activity.notifyFollowers(req.user.id, recipe.id, recipe.title);
    } catch (err) {
      next(err);
    }
  },

  /**
   * PATCH /api/recipes/:id
   * Защищённый: обновить СВОЙ рецепт
   * Передаются только те поля, которые нужно изменить
   */
  async updateRecipe(req, res, next) {
    try {
      const updated = await Recipe.updateById(req.params.id, req.user.id, req.body);
      if (!updated) {
        return res.status(404).json({
          error: 'Рецепт не найден или у вас нет прав на его редактирование',
        });
      }
      res.json({
        message: 'Рецепт обновлён',
        recipe: updated,
      });

      // Логируем активность
      Activity.log(req.user.id, 'recipe_updated', updated.id, updated.title);
    } catch (err) {
      next(err);
    }
  },

  /**
   * DELETE /api/recipes/:id
   * Защищённый: удалить СВОЙ рецепт
   */
  async deleteRecipe(req, res, next) {
    try {
      // Сначала получаем название рецепта для лога
      const recipe = await Recipe.findById(req.params.id);
      const title = recipe ? recipe.title : 'Рецепт';

      const deleted = await Recipe.deleteById(req.params.id, req.user.id);
      if (!deleted) {
        return res.status(404).json({
          error: 'Рецепт не найден или у вас нет прав на его удаление',
        });
      }

      // Логируем активность
      Activity.log(req.user.id, 'recipe_deleted', req.params.id, title);

      res.json({ message: 'Рецепт удалён' });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = recipeController;
