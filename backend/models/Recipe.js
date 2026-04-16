/**
 * Модель Recipe
 * 
 * Ключевая архитектурная особенность:
 *   - Автор указывается СТРОГО через author_id (внешний ключ на users.id)
 *   - При запросе рецептов выполняется JOIN с таблицей users
 *   - Это значит: если пользователь меняет username или avatar_url,
 *     изменения мгновенно видны во ВСЕХ его рецептах
 *   - НЕТ дублирования данных автора в таблице recipes
 */

const pool = require('../database/pool');

const Recipe = {
  /**
   * Получить список рецептов с данными автора (JOIN)
   * Поддерживает пагинацию и фильтрацию по категории
   * 
   * @param {object} options — { limit, offset, category, search }
   * @returns {{ recipes: array, total: number }}
   */
  async findAll({ limit = 20, offset = 0, category, search, sort = 'newest' } = {}) {
    // Определяем сортировку
    let orderBy = 'r.created_at DESC';
    let likesJoin = '';

    if (sort === 'popular') {
      likesJoin = ` LEFT JOIN likes l ON r.id = l.recipe_id`;
      orderBy = `COUNT(l.id) DESC, r.created_at DESC`;
    }

    // Базовый запрос с JOIN — данные автора всегда актуальны
    let baseQuery = `
      FROM recipes r
      INNER JOIN users u ON r.author_id = u.id${likesJoin}
      WHERE 1=1
    `;
    const values = [];
    let paramIndex = 1;

    // Фильтр по категории
    if (category) {
      baseQuery += ` AND r.category ILIKE $${paramIndex++}`;
      values.push(`%${category}%`);
    }

    // Поиск по названию, описанию или категории
    if (search) {
      baseQuery += ` AND (r.title ILIKE $${paramIndex} OR r.description ILIKE $${paramIndex} OR r.category ILIKE $${paramIndex})`;
      values.push(`%${search}%`);
      paramIndex++;
    }

    // Счётчик — если сортировка по популярности, нужен GROUP BY
    let countQuery = `SELECT COUNT(DISTINCT r.id) ${baseQuery}`;
    const countResult = await pool.query(countQuery, values);
    const total = parseInt(countResult.rows[0].count);

    // Основные данные с пагинацией
    values.push(limit, offset);

    // SELECT часть — если popular, добавляем COUNT(l.id)
    let selectCols = `
        r.id,
        r.title,
        r.description,
        r.image_url,
        r.time,
        r.difficulty,
        r.category,
        r.servings,
        r.views_count,
        r.created_at,
        u.id AS author_id,
        u.username AS author_username,
        u.avatar_url AS author_avatar_url
    `;

    if (sort === 'popular') {
      selectCols = `${selectCols}, COUNT(l.id) AS likes_count`;
    }

    let groupBy = '';
    if (sort === 'popular') {
      groupBy = ` GROUP BY r.id, u.id`;
    }

    const recipesResult = await pool.query(
      `SELECT ${selectCols}
       ${baseQuery}
       ${groupBy}
       ORDER BY ${orderBy}
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      values
    );

    return {
      recipes: recipesResult.rows,
      total,
    };
  },

  /**
   * Получить один рецепт по ID с полными данными + данные автора
   */
  async findById(id) {
    const result = await pool.query(
      `SELECT 
        r.*,
        u.id AS author_id,
        u.username AS author_username,
        u.avatar_url AS author_avatar_url
       FROM recipes r
       INNER JOIN users u ON r.author_id = u.id
       WHERE r.id = $1`,
      [id]
    );
    return result.rows[0];
  },

  /**
   * Создать новый рецепт
   * @param {object} data — данные рецепта + author_id
   */
  async create(data) {
    const result = await pool.query(
      `INSERT INTO recipes (
        author_id, title, description, full_description,
        image_url, ingredients, instructions, time,
        difficulty, category, servings, tags,
        calories, protein, carbs, fat, notes
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8,
        $9, $10, $11, $12, $13, $14, $15, $16, $17
      )
      RETURNING *`,
      [
        data.author_id,
        data.title,
        data.description,
        data.full_description || '',
        data.image_url || '',
        JSON.stringify(data.ingredients || []),
        data.instructions,
        data.time,
        data.difficulty || 'Средняя',
        data.category || '',
        data.servings || 4,
        data.tags || '',
        data.calories || '',
        data.protein || '',
        data.carbs || '',
        data.fat || '',
        data.notes || '',
      ]
    );

    // Возвращаем рецепт с данными автора
    return this.findById(result.rows[0].id);
  },

  /**
   * Обновить рецепт (автор или админ может)
   * Partial update — обновляются только переданные поля
   * @param {number} recipeId
   * @param {number} authorId
   * @param {object} data — поля для обновления
   * @param {boolean} isAdmin — флаг администратора
   * @returns {object|null} обновлённый рецепт или null
   */
  async updateById(recipeId, authorId, data, isAdmin = false) {
    // Проверяем что рецепт существует
    const checkResult = await pool.query(
      'SELECT id, author_id FROM recipes WHERE id = $1',
      [recipeId]
    );
    if (checkResult.rows.length === 0) return null;

    const recipeAuthorId = checkResult.rows[0].author_id;

    // Проверяем права: автор ИЛИ админ
    if (!isAdmin && recipeAuthorId !== authorId) {
      return null;
    }

    // Формируем динамический UPDATE
    const fields = [];
    const values = [];
    let paramIndex = 1;

    const fieldMappings = {
      title: 'title',
      description: 'description',
      full_description: 'full_description',
      image_url: 'image_url',
      ingredients: 'ingredients',
      instructions: 'instructions',
      time: 'time',
      difficulty: 'difficulty',
      category: 'category',
      servings: 'servings',
      tags: 'tags',
      calories: 'calories',
      protein: 'protein',
      carbs: 'carbs',
      fat: 'fat',
      notes: 'notes',
    };

    for (const [key, column] of Object.entries(fieldMappings)) {
      if (data[key] !== undefined) {
        // ingredients — это JSONB, нужно сериализовать
        if (key === 'ingredients' && Array.isArray(data[key])) {
          fields.push(`${column} = $${paramIndex++}`);
          values.push(JSON.stringify(data[key]));
        } else if (key === 'servings') {
          fields.push(`${column} = $${paramIndex++}`);
          values.push(parseInt(data[key]));
        } else {
          fields.push(`${column} = $${paramIndex++}`);
          values.push(data[key]);
        }
      }
    }

    if (fields.length === 0) return null;

    values.push(recipeId, authorId);

    const result = await pool.query(
      `UPDATE recipes
       SET ${fields.join(', ')}
       WHERE id = $${paramIndex} AND author_id = $${paramIndex + 1}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) return null;

    // Возвращаем с данными автора
    return this.findById(result.rows[0].id);
  },

  /**
   * Получить все рецепты конкретного пользователя (по author_id)
   */
  async findByAuthorId(authorId) {
    const result = await pool.query(
      `SELECT 
        r.*,
        u.id AS author_id,
        u.username AS author_username,
        u.avatar_url AS author_avatar_url
       FROM recipes r
       INNER JOIN users u ON r.author_id = u.id
       WHERE r.author_id = $1
       ORDER BY r.created_at DESC`,
      [authorId]
    );
    return result.rows;
  },

  /**
   * Увеличить счётчик просмотров
   */
  async incrementViews(id) {
    await pool.query(
      'UPDATE recipes SET views_count = views_count + 1 WHERE id = $1',
      [id]
    );
  },

  /**
   * Удалить рецепт (автор или админ может)
   * @param {number} id
   * @param {number} authorId
   * @param {boolean} isAdmin — флаг администратора
   * @returns {boolean}
   */
  async deleteById(id, authorId, isAdmin = false) {
    // Если админ — удаляем без проверки авторства
    if (isAdmin) {
      const result = await pool.query(
        'DELETE FROM recipes WHERE id = $1 RETURNING id',
        [id]
      );
      return result.rows.length > 0;
    }
    
    // Иначе проверяем что это автор
    const result = await pool.query(
      'DELETE FROM recipes WHERE id = $1 AND author_id = $2 RETURNING id',
      [id, authorId]
    );
    return result.rows.length > 0;
  },
};

module.exports = Recipe;
