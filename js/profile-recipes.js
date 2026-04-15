/**
 * profile-recipes.js — управление рецептами в профиле
 *
 * Вкладки:
 *   "Мои рецепты" — рецепты пользователя с кнопками редактирования и удаления
 *   "Избранное"   — лайкнутые рецепты, только просмотр
 */

(function () {
    'use strict';

    const API_BASE = 'http://localhost:5000/api';

    // ====== МОИ РЕЦЕПТЫ ======

    // Храним статистику — устанавливается один раз при загрузке
    let profileStatsSet = false;

    async function loadMyRecipes() {
        const token = localStorage.getItem('token');
        if (!token) return;

        const container = document.getElementById('myRecipesList');
        const emptyState = document.getElementById('myRecipesEmpty');
        const countEl = document.getElementById('recipesCount');
        const likesEl = document.getElementById('likesCount');
        if (!container || !emptyState) return;

        try {
            const response = await fetch(`${API_BASE}/users/me`, {
                headers: { 'Authorization': 'Bearer ' + token },
            });
            if (!response.ok) return;

            const data = await response.json();
            const recipes = data.recipes || [];

            if (countEl) countEl.textContent = recipes.length;

            // Статистика устанавливается ОДИН РАЗ
            if (!profileStatsSet) {
                if (likesEl) likesEl.textContent = data.totalLikes || 0;
                const favsEl = document.getElementById('favoritesCount');
                if (favsEl) favsEl.textContent = data.totalFavorites || 0;
                profileStatsSet = true;
            }

            if (recipes.length === 0) {
                container.style.display = 'none';
                emptyState.style.display = 'block';
                return;
            }

            container.style.display = 'grid';
            emptyState.style.display = 'none';
            container.innerHTML = '';

            recipes.forEach(recipe => {
                container.appendChild(createMyRecipeCard(recipe));
            });
        } catch (err) {
            console.error('[profile-recipes] Ошибка загрузки моих рецептов:', err);
        }
    }

    function createMyRecipeCard(recipe) {
        const card = document.createElement('div');
        card.className = 'recipe-card';
        card.dataset.id = recipe.id;

        const avatarUrl = recipe.author_avatar_url || 'https://ui-avatars.com/api/?background=FF6B6B&color=fff&name=' + (recipe.author_username || 'U');
        const imageUrl = recipe.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=200&fit=crop';
        const badge = recipe.category || 'Рецепт';

        card.innerHTML = `
            <div class="recipe-image">
                <img src="${imageUrl}" alt="${escapeHtml(recipe.title)}" loading="lazy">
                <span class="recipe-badge">${escapeHtml(badge)}</span>
                <div class="recipe-actions">
                    <button class="btn-action btn-edit-recipe" onclick="event.stopPropagation(); openEditModal(${recipe.id})" title="Редактировать">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-action btn-delete-recipe" onclick="event.stopPropagation(); deleteRecipe(${recipe.id})" title="Удалить">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </div>
            <div class="recipe-content">
                <div class="recipe-header">
                    <div>
                        <h3 class="recipe-title">${escapeHtml(recipe.title)}</h3>
                        <div class="recipe-author">
                            <div class="author-avatar-small">
                                <img src="${avatarUrl}" alt="${escapeHtml(recipe.author_username)}">
                            </div>
                            <span>${escapeHtml(recipe.author_username)}</span>
                        </div>
                    </div>
                </div>
                <p class="recipe-description">${escapeHtml(recipe.description)}</p>
                <div class="recipe-meta">
                    <div class="meta-item">
                        <i class="fas fa-clock"></i>
                        <span>${escapeHtml(recipe.time)}</span>
                    </div>
                    <div class="meta-item">
                        <i class="fas fa-fire"></i>
                        <span>${escapeHtml(recipe.difficulty)}</span>
                    </div>
                    <div class="meta-item">
                        <i class="fas fa-user-friends"></i>
                        <span>${recipe.servings || '—'}</span>
                    </div>
                </div>
            </div>
        `;

        card.addEventListener('click', function (e) {
            if (e.target.closest('.recipe-actions')) return;
            window.location.href = `recipe-detail.html?id=${recipe.id}`;
        });

        return card;
    }

    // ====== МОДАЛЬНОЕ ОКНО РЕДАКТИРОВАНИЯ ======

    /**
     * Открыть модалку редактирования рецепта
     */
    window.openEditModal = async function(recipeId) {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            // Загружаем полные данные рецепта
            const response = await fetch(`${API_BASE}/recipes/${recipeId}`, {
                headers: { 'Authorization': 'Bearer ' + token },
            });
            if (!response.ok) {
                alert('Не удалось загрузить рецепт');
                return;
            }

            const data = await response.json();
            const recipe = data.recipe;

            // Создаём или получаем модалку
            let modal = document.getElementById('editRecipeModal');
            if (!modal) {
                modal = createEditModal();
                document.body.appendChild(modal);
            }

            // Заполняем поля данными рецепта
            document.getElementById('editRecipeId').value = recipe.id;
            document.getElementById('editTitle').value = recipe.title || '';
            document.getElementById('editDescription').value = recipe.description || '';
            document.getElementById('editFullDescription').value = recipe.full_description || '';
            document.getElementById('editImageUrl').value = recipe.image_url || '';
            document.getElementById('editTime').value = recipe.time || '';
            document.getElementById('editDifficulty').value = recipe.difficulty || 'Средняя';
            document.getElementById('editCategory').value = recipe.category || '';
            document.getElementById('editServings').value = recipe.servings || 4;
            document.getElementById('editTags').value = recipe.tags || '';
            document.getElementById('editNotes').value = recipe.notes || '';
            document.getElementById('editCalories').value = recipe.calories || '';
            document.getElementById('editProtein').value = recipe.protein || '';
            document.getElementById('editCarbs').value = recipe.carbs || '';
            document.getElementById('editFat').value = recipe.fat || '';

            // Ингредиенты
            const ingredientsContainer = document.getElementById('editIngredientsContainer');
            ingredientsContainer.innerHTML = '';
            try {
                const ings = typeof recipe.ingredients === 'string' ? JSON.parse(recipe.ingredients) : recipe.ingredients;
                ings.forEach(ing => {
                    ingredientsContainer.appendChild(createEditIngredientItem(ing));
                });
            } catch {
                ingredientsContainer.appendChild(createEditIngredientItem());
            }

            // Инструкция
            document.getElementById('editInstructions').value = recipe.instructions || '';

            // Показываем модалку
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';

        } catch (err) {
            console.error('[profile-recipes] Ошибка загрузки рецепта:', err);
            alert('Ошибка загрузки рецепта');
        }
    };

    function createEditModal() {
        const modal = document.createElement('div');
        modal.id = 'editRecipeModal';
        modal.className = 'edit-recipe-modal';
        modal.innerHTML = `
            <div class="edit-recipe-modal__overlay" onclick="closeEditModal()"></div>
            <div class="edit-recipe-modal__content">
                <div class="edit-recipe-modal__header">
                    <h3><i class="fas fa-edit"></i> Редактирование рецепта</h3>
                    <button class="edit-recipe-modal__close" onclick="closeEditModal()"><i class="fas fa-times"></i></button>
                </div>
                <div class="edit-recipe-modal__body">
                    <input type="hidden" id="editRecipeId">

                    <div class="edit-form-group">
                        <label>Название</label>
                        <input type="text" id="editTitle" class="edit-form-control" placeholder="Название рецепта" required>
                    </div>

                    <div class="edit-form-group">
                        <label>Краткое описание</label>
                        <textarea id="editDescription" class="edit-form-control" rows="3" placeholder="Краткое описание" required></textarea>
                    </div>

                    <div class="edit-form-group">
                        <label>Подробное описание</label>
                        <textarea id="editFullDescription" class="edit-form-control" rows="3" placeholder="Подробное описание"></textarea>
                    </div>

                    <div class="edit-form-group">
                        <label>Ссылка на изображение</label>
                        <input type="url" id="editImageUrl" class="edit-form-control" placeholder="https://example.com/photo.jpg">
                    </div>

                    <div class="edit-form-group">
                        <label>Ингредиенты (каждый с новой строки)</label>
                        <div id="editIngredientsContainer"></div>
                        <button type="button" class="edit-add-ingredient-btn" onclick="addEditIngredient()">
                            <i class="fas fa-plus"></i> Добавить ингредиент
                        </button>
                    </div>

                    <div class="edit-form-group">
                        <label>Инструкция приготовления</label>
                        <textarea id="editInstructions" class="edit-form-control" rows="5" placeholder="Каждый шаг с новой строки"></textarea>
                    </div>

                    <div class="edit-form-row">
                        <div class="edit-form-group">
                            <label>Время</label>
                            <input type="text" id="editTime" class="edit-form-control" placeholder="30 мин">
                        </div>
                        <div class="edit-form-group">
                            <label>Сложность</label>
                            <select id="editDifficulty" class="edit-form-control">
                                <option value="Лёгкая">Лёгкая</option>
                                <option value="Средняя">Средняя</option>
                                <option value="Сложная">Сложная</option>
                            </select>
                        </div>
                    </div>

                    <div class="edit-form-row">
                        <div class="edit-form-group">
                            <label>Категория</label>
                            <input type="text" id="editCategory" class="edit-form-control" placeholder="🍝 Основные блюда">
                        </div>
                        <div class="edit-form-group">
                            <label>Порции</label>
                            <input type="number" id="editServings" class="edit-form-control" min="1" max="20">
                        </div>
                    </div>

                    <div class="edit-form-group">
                        <label>Теги</label>
                        <input type="text" id="editTags" class="edit-form-control" placeholder="итальянская, паста">
                    </div>

                    <div class="edit-form-group">
                        <label>Советы</label>
                        <textarea id="editNotes" class="edit-form-control" rows="2" placeholder="Полезные советы"></textarea>
                    </div>

                    <div class="edit-form-group">
                        <label>Пищевая ценность</label>
                        <div class="edit-form-row">
                            <input type="text" id="editCalories" class="edit-form-control" placeholder="Калории">
                            <input type="text" id="editProtein" class="edit-form-control" placeholder="Белки">
                            <input type="text" id="editCarbs" class="edit-form-control" placeholder="Углеводы">
                            <input type="text" id="editFat" class="edit-form-control" placeholder="Жиры">
                        </div>
                    </div>
                </div>
                <div class="edit-recipe-modal__footer">
                    <button class="edit-btn edit-btn-save" onclick="saveEditedRecipe()">
                        <i class="fas fa-save"></i> Сохранить
                    </button>
                    <button class="edit-btn edit-btn-cancel" onclick="closeEditModal()">
                        <i class="fas fa-times"></i> Отменить
                    </button>
                </div>
            </div>
        `;

        return modal;
    }

    window.closeEditModal = function() {
        const modal = document.getElementById('editRecipeModal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    };

    function createEditIngredientItem(value = '') {
        const div = document.createElement('div');
        div.className = 'edit-ingredient-item';
        div.innerHTML = `
            <input type="text" class="edit-form-control" placeholder="Например: 500 г куриного филе" value="${value}">
            <button type="button" class="edit-remove-ingredient" onclick="this.parentElement.remove()">
                <i class="fas fa-trash-alt"></i>
            </button>
        `;
        return div;
    }

    window.addEditIngredient = function() {
        document.getElementById('editIngredientsContainer').appendChild(createEditIngredientItem());
    };

    /**
     * Сохранить отредактированный рецепт
     */
    window.saveEditedRecipe = async function() {
        const token = localStorage.getItem('token');
        if (!token) return;

        const recipeId = document.getElementById('editRecipeId').value;
        const title = document.getElementById('editTitle').value.trim();
        const description = document.getElementById('editDescription').value.trim();

        if (!title || !description) {
            alert('Название и описание обязательны');
            return;
        }

        // Сбор ингредиентов
        const ingredients = [];
        document.querySelectorAll('#editIngredientsContainer input').forEach(input => {
            if (input.value.trim()) ingredients.push(input.value.trim());
        });

        if (ingredients.length === 0) {
            alert('Добавьте хотя бы один ингредиент');
            return;
        }

        const saveBtn = document.querySelector('.edit-btn-save');
        const originalText = saveBtn.innerHTML;
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Сохранение...';
        saveBtn.disabled = true;

        try {
            const updateData = {
                title: title,
                description: description,
                full_description: document.getElementById('editFullDescription').value.trim(),
                image_url: document.getElementById('editImageUrl').value.trim(),
                ingredients: ingredients,
                instructions: document.getElementById('editInstructions').value.trim(),
                time: document.getElementById('editTime').value.trim(),
                difficulty: document.getElementById('editDifficulty').value,
                category: document.getElementById('editCategory').value.trim(),
                servings: parseInt(document.getElementById('editServings').value) || 4,
                tags: document.getElementById('editTags').value.trim(),
                notes: document.getElementById('editNotes').value.trim(),
                calories: document.getElementById('editCalories').value.trim(),
                protein: document.getElementById('editProtein').value.trim(),
                carbs: document.getElementById('editCarbs').value.trim(),
                fat: document.getElementById('editFat').value.trim(),
            };

            const response = await fetch(`${API_BASE}/recipes/${recipeId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token,
                },
                body: JSON.stringify(updateData),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Ошибка сохранения');

            closeEditModal();

            // Перезагружаем список рецептов
            loadMyRecipes();

        } catch (err) {
            alert(err.message || 'Ошибка сохранения');
        } finally {
            saveBtn.innerHTML = originalText;
            saveBtn.disabled = false;
        }
    };

    // ====== УДАЛЕНИЕ ======

    window.deleteRecipe = async function(id) {
        const token = localStorage.getItem('token');
        if (!token) return;

        if (!confirm('Удалить этот рецепт? Это действие нельзя отменить.')) return;

        try {
            const response = await fetch(`${API_BASE}/recipes/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': 'Bearer ' + token },
            });

            if (!response.ok) {
                const data = await response.json();
                alert(data.error || 'Ошибка удаления');
                return;
            }

            // Удаляем карточку из DOM мгновенно (Optimistic UI)
            const card = document.querySelector(`.recipe-card[data-id="${id}"]`);
            if (card) {
                card.style.transition = 'opacity 0.3s, transform 0.3s';
                card.style.opacity = '0';
                card.style.transform = 'scale(0.8)';
                setTimeout(() => {
                    card.remove();
                    const remaining = document.querySelectorAll('#myRecipesList .recipe-card').length;
                    const countEl = document.getElementById('recipesCount');
                    if (countEl) countEl.textContent = remaining;

                    if (remaining === 0) {
                        document.getElementById('myRecipesList').style.display = 'none';
                        document.getElementById('myRecipesEmpty').style.display = 'block';
                    }
                }, 300);
            }
        } catch (err) {
            console.error('[profile-recipes] Ошибка удаления:', err);
            alert('Ошибка сети');
        }
    };

    // ====== ИЗБРАННОЕ ======

    async function loadFavorites() {
        const token = localStorage.getItem('token');
        if (!token) return;

        const container = document.getElementById('favoritesList');
        const emptyState = document.getElementById('favoritesEmpty');
        if (!container || !emptyState) return;

        try {
            const response = await fetch(`${API_BASE}/users/me/favorites`, {
                headers: { 'Authorization': 'Bearer ' + token },
            });
            if (!response.ok) return;

            const data = await response.json();
            const favorites = data.favorites || [];

            // НЕ перезаписываем статистику в шапке!
            // #favoritesCount в шапке = сколько раз ДРУГИЕ добавили рецепты автора в избранное
            // Это значение устанавливается ОДИН РАЗ в loadMyRecipes()

            if (favorites.length === 0) {
                container.style.display = 'none';
                emptyState.style.display = 'block';
                return;
            }

            container.style.display = 'grid';
            emptyState.style.display = 'none';
            container.innerHTML = '';

            favorites.forEach(recipe => {
                container.appendChild(createFavoriteCard(recipe));
            });
        } catch (err) {
            console.error('[profile-recipes] Ошибка загрузки избранного:', err);
        }
    }

    // ====== АКТИВНОСТЬ ======

    async function loadActivity() {
        const token = localStorage.getItem('token');
        if (!token) return;

        const container = document.getElementById('activityList');
        const emptyState = document.getElementById('activityEmpty');
        if (!container) return;

        try {
            const response = await fetch(`${API_BASE}/users/me/activity`, {
                headers: { 'Authorization': 'Bearer ' + token },
            });
            if (!response.ok) return;

            const data = await response.json();
            const activities = data.activities || [];

            if (activities.length === 0) {
                container.innerHTML = '';
                if (emptyState) emptyState.style.display = 'block';
                return;
            }

            if (emptyState) emptyState.style.display = 'none';
            container.innerHTML = '';

            activities.forEach(act => {
                container.appendChild(createActivityItem(act));
            });
        } catch (err) {
            console.error('[profile-recipes] Ошибка загрузки активности:', err);
        }
    }

    function createActivityItem(act) {
        const div = document.createElement('div');
        div.className = 'activity-item';

        const iconMap = {
            recipe_created: 'fa-plus',
            recipe_updated: 'fa-edit',
            recipe_deleted: 'fa-trash-alt',
            recipe_favorited: 'fa-heart',
            recipe_unfavorited: 'fa-heart-broken',
            subscribed: 'fa-user-plus',
        };

        const textMap = {
            recipe_created: `Вы опубликовали рецепт <strong>"${escapeHtml(act.recipe_title || 'Рецепт')}"</strong>`,
            recipe_updated: `Вы отредактировали рецепт <strong>"${escapeHtml(act.recipe_title || 'Рецепт')}"</strong>`,
            recipe_deleted: `Вы удалили рецепт <strong>"${escapeHtml(act.recipe_title || 'Рецепт')}"</strong>`,
            recipe_favorited: `Вам понравился рецепт <strong>"${escapeHtml(act.recipe_title || 'Рецепт')}"</strong>`,
            recipe_unfavorited: `Вы убрали из избранного рецепт <strong>"${escapeHtml(act.recipe_title || 'Рецепт')}"</strong>`,
            subscribed: `Вы подписались на <strong>"${escapeHtml(act.recipe_title || 'Автора')}"</strong>`,
        };

        const icon = iconMap[act.action] || 'fa-circle';
        const text = textMap[act.action] || act.action;
        const timeAgo = getTimeAgo(act.created_at);

        div.innerHTML = `
            <div class="activity-icon">
                <i class="fas ${icon}"></i>
            </div>
            <div class="activity-content">
                <p>${text}</p>
                <span class="activity-time">${timeAgo}</span>
            </div>
        `;

        return div;
    }

    function getTimeAgo(dateStr) {
        const now = new Date();
        const date = new Date(dateStr);
        const diffMs = now - date;
        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffHour = Math.floor(diffMin / 60);
        const diffDay = Math.floor(diffHour / 24);

        if (diffSec < 60) return 'только что';
        if (diffMin < 60) return `${diffMin} мин. назад`;
        if (diffHour < 24) return `${diffHour} ч. назад`;
        if (diffDay < 7) return `${diffDay} дн. назад`;
        return date.toLocaleDateString('ru-RU');
    }

    function createFavoriteCard(recipe) {
        const card = document.createElement('div');
        card.className = 'recipe-card';
        card.dataset.id = recipe.id;

        const avatarUrl = recipe.author_avatar_url || 'https://ui-avatars.com/api/?background=FF6B6B&color=fff&name=' + (recipe.author_username || 'U');
        const imageUrl = recipe.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=200&fit=crop';
        const badge = recipe.category || 'Рецепт';

        card.innerHTML = `
            <div class="recipe-image">
                <img src="${imageUrl}" alt="${escapeHtml(recipe.title)}" loading="lazy">
                <span class="recipe-badge">${escapeHtml(badge)}</span>
                <div class="recipe-actions">
                    <button class="btn-action btn-like-feed"
                            data-id="${recipe.id}"
                            onclick="event.stopPropagation(); event.preventDefault(); toggleLikeProfile(${recipe.id}, this)"
                            title="Лайк">
                        <i class="fas fa-thumbs-up"></i>
                    </button>
                    <button class="btn-action btn-unfavorite" onclick="event.stopPropagation(); unfavoriteRecipe(${recipe.id})" title="Убрать из избранного">
                        <i class="fas fa-heart"></i>
                    </button>
                </div>
            </div>
            <div class="recipe-content">
                <div class="recipe-header">
                    <div>
                        <h3 class="recipe-title">${escapeHtml(recipe.title)}</h3>
                        <div class="recipe-author">
                            <div class="author-avatar-small">
                                <img src="${avatarUrl}" alt="${escapeHtml(recipe.author_username)}">
                            </div>
                            <span>${escapeHtml(recipe.author_username)}</span>
                        </div>
                    </div>
                </div>
                <p class="recipe-description">${escapeHtml(recipe.description)}</p>
                <div class="recipe-meta">
                    <div class="meta-item">
                        <i class="fas fa-clock"></i>
                        <span>${escapeHtml(recipe.time)}</span>
                    </div>
                    <div class="meta-item">
                        <i class="fas fa-fire"></i>
                        <span>${escapeHtml(recipe.difficulty)}</span>
                    </div>
                    <div class="meta-item">
                        <i class="fas fa-user-friends"></i>
                        <span>${recipe.servings || '—'}</span>
                    </div>
                </div>
            </div>
        `;

        card.addEventListener('click', function (e) {
            if (e.target.closest('.recipe-actions')) return;
            window.location.href = `recipe-detail.html?id=${recipe.id}`;
        });

        return card;
    }

    window.unfavoriteRecipe = async function(id) {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const response = await fetch(`${API_BASE}/recipes/${id}/favorite`, {
                method: 'POST',
                headers: { 'Authorization': 'Bearer ' + token },
            });
            if (!response.ok) return;

            const card = document.querySelector(`.recipe-card[data-id="${id}"]`);
            if (card) {
                card.style.transition = 'opacity 0.3s, transform 0.3s';
                card.style.opacity = '0';
                card.style.transform = 'scale(0.8)';
                setTimeout(() => {
                    card.remove();
                    const remaining = document.querySelectorAll('#favoritesList .recipe-card').length;
                    const countEl = document.getElementById('favoritesCount');
                    if (countEl) countEl.textContent = remaining;

                    if (remaining === 0) {
                        document.getElementById('favoritesList').style.display = 'none';
                        document.getElementById('favoritesEmpty').style.display = 'block';
                    }
                }, 300);
            }
        } catch (err) {
            console.error('[profile-recipes] Ошибка удаления из избранного:', err);
        }
    };

    /**
     * Лайк рецепта из профиля (вкладка "Избранное")
     */
    window.toggleLikeProfile = async function(id, btnEl) {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            btnEl.style.transform = 'scale(1.3)';
            setTimeout(() => { btnEl.style.transform = ''; }, 200);

            const response = await fetch(`${API_BASE}/recipes/${id}/like`, {
                method: 'POST',
                headers: { 'Authorization': 'Bearer ' + token },
            });
            if (!response.ok) return;

            const data = await response.json();
            btnEl.classList.toggle('active', data.action === 'added');
        } catch (err) {
            console.error('[profile-recipes] Ошибка лайка:', err);
        }
    };

    // ====== ЛАЙКНУТЫЕ РЕЦЕПТЫ ======

    async function loadLikedRecipes() {
        const token = localStorage.getItem('token');
        if (!token) return;

        const container = document.getElementById('likedRecipesList');
        const emptyState = document.getElementById('likedRecipesEmpty');
        if (!container || !emptyState) return;

        try {
            const response = await fetch(`${API_BASE}/users/me/liked-recipes`, {
                headers: { 'Authorization': 'Bearer ' + token },
            });
            if (!response.ok) return;

            const data = await response.json();
            const recipes = data.recipes || [];

            if (recipes.length === 0) {
                container.style.display = 'none';
                emptyState.style.display = 'block';
                return;
            }

            container.style.display = 'grid';
            emptyState.style.display = 'none';
            container.innerHTML = '';

            recipes.forEach(recipe => {
                container.appendChild(createLikedRecipeCard(recipe));
            });
        } catch (err) {
            console.error('[profile-recipes] Ошибка загрузки лайкнутых рецептов:', err);
        }
    }

    function createLikedRecipeCard(recipe) {
        const card = document.createElement('div');
        card.className = 'recipe-card';
        card.dataset.id = recipe.id;

        const avatarUrl = recipe.author_avatar_url || 'https://ui-avatars.com/api/?background=FF6B6B&color=fff&name=' + (recipe.author_username || 'U');
        const imageUrl = recipe.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=200&fit=crop';
        const badge = recipe.category || 'Рецепт';

        card.innerHTML = `
            <div class="recipe-image">
                <img src="${imageUrl}" alt="${escapeHtml(recipe.title)}" loading="lazy">
                <span class="recipe-badge">${escapeHtml(badge)}</span>
                <div class="recipe-actions">
                    <button class="btn-action btn-like-feed active"
                            data-id="${recipe.id}"
                            onclick="event.stopPropagation(); event.preventDefault(); toggleLikeProfile(${recipe.id}, this)"
                            title="Убрать лайк">
                        <i class="fas fa-thumbs-up"></i>
                    </button>
                </div>
            </div>
            <div class="recipe-content">
                <div class="recipe-header">
                    <div>
                        <h3 class="recipe-title">${escapeHtml(recipe.title)}</h3>
                        <div class="recipe-author">
                            <div class="author-avatar-small">
                                <img src="${avatarUrl}" alt="${escapeHtml(recipe.author_username)}">
                            </div>
                            <span>${escapeHtml(recipe.author_username)}</span>
                        </div>
                    </div>
                </div>
                <p class="recipe-description">${escapeHtml(recipe.description)}</p>
                <div class="recipe-meta">
                    <div class="meta-item">
                        <i class="fas fa-clock"></i>
                        <span>${escapeHtml(recipe.time)}</span>
                    </div>
                    <div class="meta-item">
                        <i class="fas fa-fire"></i>
                        <span>${escapeHtml(recipe.difficulty)}</span>
                    </div>
                    <div class="meta-item">
                        <i class="fas fa-user-friends"></i>
                        <span>${recipe.servings || '—'}</span>
                    </div>
                </div>
            </div>
        `;

        card.addEventListener('click', function (e) {
            if (e.target.closest('.recipe-actions')) return;
            window.location.href = `recipe-detail.html?id=${recipe.id}`;
        });

        return card;
    }

    // ====== ПОДПИСКИ ======

    async function loadFollowing() {
        const token = localStorage.getItem('token');
        if (!token) return;

        const container = document.getElementById('followingList');
        const emptyState = document.getElementById('followingEmpty');
        if (!container || !emptyState) return;

        try {
            const response = await fetch(`${API_BASE}/users/me/following`, {
                headers: { 'Authorization': 'Bearer ' + token },
            });
            if (!response.ok) return;

            const data = await response.json();
            const following = data.following || [];

            if (following.length === 0) {
                container.style.display = 'none';
                emptyState.style.display = 'block';
                return;
            }

            container.style.display = 'grid';
            emptyState.style.display = 'none';
            container.innerHTML = '';

            following.forEach(user => {
                container.appendChild(createAuthorCard(user));
            });

            // Загружаем уведомления о новых рецептах
            if (typeof loadRecipeNotifications === 'function') loadRecipeNotifications();
        } catch (err) {
            console.error('[profile-recipes] Ошибка загрузки подписок:', err);
        }
    }

    function createAuthorCard(user) {
        const card = document.createElement('div');
        card.className = 'author-card';
        card.style.cssText = 'background:white;border-radius:var(--radius-lg);padding:20px;display:flex;align-items:center;gap:15px;cursor:pointer;transition:all var(--transition-normal);box-shadow:var(--shadow-sm);';
        card.onclick = function() { window.location.href = `profile.html?id=${user.id}`; };

        card.innerHTML = `
            <img src="${escapeHtml(user.avatar_url)}" alt="${escapeHtml(user.username)}" style="width:60px;height:60px;border-radius:50%;object-fit:cover;">
            <div>
                <strong style="font-size:1.1rem;color:var(--dark-color);">${escapeHtml(user.username)}</strong>
                <div style="font-size:0.85rem;color:var(--gray-color);margin-top:4px;">
                    <i class="fas fa-clock"></i> Подписка ${getTimeAgo(user.created_at)}
                </div>
            </div>
        `;

        return card;
    }

    function escapeHtml(str) {
        if (!str) return '';
        return String(str).replace(/[&<>"']/g, function(m) {
            return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[m];
        });
    }

    // ====== CSS ======
    function injectStyles() {
        if (document.getElementById('profile-recipes-styles')) return;
        const style = document.createElement('style');
        style.id = 'profile-recipes-styles';
        style.textContent = `
            .btn-edit-recipe i {
                color: var(--secondary-color, #4ECDC4);
            }
            .btn-edit-recipe:hover {
                background: var(--secondary-color, #4ECDC4) !important;
            }
            .btn-delete-recipe i {
                -webkit-text-stroke: 1.5px var(--danger-color, #D63031);
                color: transparent;
            }
            .btn-delete-recipe:hover {
                background: var(--danger-color, #D63031) !important;
            }
            .btn-delete-recipe:hover i {
                -webkit-text-stroke: 0;
                color: white;
            }
            .btn-unfavorite i {
                -webkit-text-stroke: 0;
                color: var(--primary-color);
            }
            .btn-unfavorite:hover {
                background: var(--primary-color) !important;
            }
            .btn-unfavorite:hover i {
                color: white;
            }

            /* Модалка редактирования */
            .edit-recipe-modal {
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                z-index: 10000;
            }
            .edit-recipe-modal.active {
                display: flex;
                align-items: flex-start;
                justify-content: center;
            }
            .edit-recipe-modal__overlay {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0,0,0,0.6);
                backdrop-filter: blur(4px);
            }
            .edit-recipe-modal__content {
                position: relative;
                background: white;
                border-radius: var(--radius-xl, 16px);
                width: 90%;
                max-width: 700px;
                max-height: 90vh;
                margin: 40px auto;
                display: flex;
                flex-direction: column;
                box-shadow: var(--shadow-lg);
                z-index: 1;
            }
            .edit-recipe-modal__header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 20px 25px;
                border-bottom: 1px solid var(--light-gray, #DFE6E9);
            }
            .edit-recipe-modal__header h3 {
                margin: 0;
                font-size: 1.2rem;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            .edit-recipe-modal__header h3 i {
                color: var(--primary-color, #FF6B6B);
            }
            .edit-recipe-modal__close {
                background: none;
                border: none;
                font-size: 1.3rem;
                cursor: pointer;
                color: var(--gray-color, #636E72);
                padding: 8px;
                border-radius: 50%;
                transition: all var(--transition-normal, 0.3s);
            }
            .edit-recipe-modal__close:hover {
                background: var(--light-color, #F9F9F9);
                color: var(--danger-color, #D63031);
            }
            .edit-recipe-modal__body {
                padding: 25px;
                overflow-y: auto;
                flex: 1;
            }
            .edit-form-group {
                margin-bottom: 18px;
            }
            .edit-form-group label {
                display: block;
                margin-bottom: 6px;
                font-weight: 500;
                font-size: 0.9rem;
                color: var(--dark-color, #2D3436);
            }
            .edit-form-control {
                width: 100%;
                padding: 10px 14px;
                border: 2px solid var(--light-gray, #DFE6E9);
                border-radius: var(--radius-md, 12px);
                font-family: var(--font-primary, 'Poppins'), sans-serif;
                font-size: 0.95rem;
                transition: border-color 0.2s;
            }
            .edit-form-control:focus {
                outline: none;
                border-color: var(--primary-color, #FF6B6B);
            }
            textarea.edit-form-control {
                min-height: 80px;
                resize: vertical;
            }
            .edit-form-row {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 12px;
            }
            .edit-ingredient-item {
                display: flex;
                gap: 8px;
                margin-bottom: 8px;
                align-items: center;
            }
            .edit-add-ingredient-btn,
            .edit-remove-ingredient {
                background: var(--light-color, #F9F9F9);
                border: 1px solid var(--light-gray, #DFE6E9);
                border-radius: var(--radius-md, 12px);
                padding: 8px 12px;
                cursor: pointer;
                transition: all var(--transition-normal, 0.3s);
                font-size: 0.85rem;
                color: var(--gray-color, #636E72);
            }
            .edit-add-ingredient-btn:hover {
                background: var(--primary-color, #FF6B6B);
                color: white;
                border-color: var(--primary-color, #FF6B6B);
            }
            .edit-remove-ingredient {
                width: 36px;
                height: 36px;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 0;
            }
            .edit-remove-ingredient:hover {
                background: var(--danger-color, #D63031);
                color: white;
                border-color: var(--danger-color, #D63031);
            }
            .edit-recipe-modal__footer {
                display: flex;
                gap: 12px;
                justify-content: flex-end;
                padding: 15px 25px;
                border-top: 1px solid var(--light-gray, #DFE6E9);
            }
            .edit-btn {
                padding: 10px 20px;
                border-radius: var(--radius-sm, 8px);
                border: none;
                cursor: pointer;
                font-family: var(--font-primary, 'Poppins'), sans-serif;
                font-size: 0.95rem;
                font-weight: 500;
                display: flex;
                align-items: center;
                gap: 6px;
                transition: all var(--transition-normal, 0.3s);
            }
            .edit-btn-save {
                background: var(--gradient-primary, linear-gradient(135deg, #FF6B6B, #FF8E53));
                color: white;
            }
            .edit-btn-save:hover {
                transform: translateY(-2px);
                box-shadow: var(--shadow-md, 0 4px 20px rgba(0,0,0,0.1));
            }
            .edit-btn-cancel {
                background: var(--light-color, #F9F9F9);
                color: var(--gray-color, #636E72);
                border: 1px solid var(--light-gray, #DFE6E9);
            }
            .edit-btn-cancel:hover {
                background: var(--light-gray, #DFE6E9);
            }

            @media (max-width: 768px) {
                .edit-recipe-modal__content {
                    width: 95%;
                    margin: 20px auto;
                    max-height: 95vh;
                }
                .edit-form-row {
                    grid-template-columns: 1fr;
                }
                .edit-recipe-modal__header h3 {
                    font-size: 1rem;
                }
            }
        `;
        document.head.appendChild(style);
    }

    // ====== ИНИЦИАЛИЗАЦИЯ ======
    injectStyles();
    loadMyRecipes();
    loadFavorites();
    loadActivity();
    loadLikedRecipes();
    loadFollowing();

    // Перезагрузка при переключении вкладки
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(m) {
            if (m.attributeName === 'class') {
                const el = m.target;
                if (el.id === 'my-recipes' && el.classList.contains('active')) {
                    loadMyRecipes();
                }
                if (el.id === 'favorites' && el.classList.contains('active')) {
                    loadFavorites();
                }
                if (el.id === 'activity' && el.classList.contains('active')) {
                    loadActivity();
                }
                if (el.id === 'liked-recipes' && el.classList.contains('active')) {
                    loadLikedRecipes();
                }
                if (el.id === 'following' && el.classList.contains('active')) {
                    loadFollowing();
                }
            }
        });
    });

    document.querySelectorAll('.tab-content').forEach(tab => {
        observer.observe(tab, { attributes: true });
    });

    // Закрытие модалки по Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeEditModal();
        }
    });
})();
