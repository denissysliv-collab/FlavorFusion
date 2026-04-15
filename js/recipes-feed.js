/**
 * recipes-feed.js — рендеринг ленты рецептов
 *
 * Загружает рецепты с API и создаёт карточки по образцу из primer/card_page.html.
 * Каждый клик по карточке → recipe-detail.html?id=...
 *
 * Архитектура: данные автора приходят через JOIN — всегда актуальны.
 */

(function () {
    'use strict';

    const API_BASE = 'http://localhost:5000/api';
    const container = document.getElementById('recipesContainer');
    const loadMoreBtn = document.getElementById('loadMore');

    if (!container) return;

    let offset = 0;
    const limit = 6;
    let isLoading = false;
    let hasMore = true;

    // Текущие фильтры
    let currentCategory = null;
    let currentSearch = '';
    let currentSort = 'newest'; // 'newest' или 'popular'

    /**
     * Создать HTML карточки рецепта
     */
    function createRecipeCard(recipe) {
        const card = document.createElement('div');
        card.className = 'recipe-card fade-in';
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
                            onclick="event.stopPropagation(); event.preventDefault(); toggleLikeFeed(${recipe.id}, this)"
                            title="Лайк">
                        <i class="fas fa-thumbs-up"></i>
                    </button>
                    <button class="btn-action btn-favorite ${recipe.is_favorite ? 'active' : ''}"
                            data-id="${recipe.id}"
                            onclick="event.stopPropagation(); event.preventDefault(); toggleFavoriteFromFeed(${recipe.id}, this)"
                            title="В избранное">
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
                            <a href="profile.html?id=${recipe.author_id}" onclick="event.stopPropagation();">${escapeHtml(recipe.author_username)}</a>
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

        // Клик по карточке → страница рецепта
        card.addEventListener('click', function (e) {
            if (e.target.closest('.recipe-actions')) return;
            openRecipe(recipe.id);
        });

        return card;
    }

    /**
     * Загрузить рецепты и добавить в ленту
     */
    async function loadRecipes(scrollToResults) {
        if (isLoading || !hasMore) return;
        isLoading = true;

        if (loadMoreBtn) {
            loadMoreBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Загрузка...';
        }

        try {
            const params = new URLSearchParams({ limit, offset });
            if (currentCategory) params.set('category', currentCategory);
            if (currentSearch) params.set('search', currentSearch);
            if (currentSort && currentSort !== 'newest') params.set('sort', currentSort);

            const token = localStorage.getItem('token');
            const headers = {};
            if (token) headers['Authorization'] = 'Bearer ' + token;

            const response = await fetch(`${API_BASE}/recipes?${params}`, { headers });
            if (!response.ok) throw new Error('Ошибка загрузки');

            const data = await response.json();
            hasMore = data.pagination.hasMore;

            if (offset === 0) {
                container.innerHTML = ''; // Очистить при первой загрузке
            }

            if (data.recipes.length === 0 && offset === 0) {
                container.innerHTML = `
                    <div style="grid-column:1/-1;text-align:center;padding:60px 20px;color:var(--gray-color);">
                        <i class="fas fa-search" style="font-size:3rem;margin-bottom:15px;display:block;opacity:0.3;"></i>
                        <h3 style="margin-bottom:8px;">Ничего не найдено</h3>
                        <p>Попробуйте изменить запрос или категорию</p>
                    </div>
                `;
                if (loadMoreBtn) loadMoreBtn.style.display = 'none';
                return;
            }

            data.recipes.forEach(recipe => {
                container.appendChild(createRecipeCard(recipe));
            });

            offset += limit;

            if (!hasMore && loadMoreBtn) {
                loadMoreBtn.style.display = 'none';
            }

            // Скролл к результатам (только при первом поиске/фильтре)
            if (scrollToResults) {
                const featuredSection = document.querySelector('.featured-recipes');
                if (featuredSection) {
                    setTimeout(() => {
                        featuredSection.scrollIntoView({ behavior: 'smooth' });
                    }, 100);
                }
            }
        } catch (err) {
            console.error('[recipes-feed] Ошибка:', err);
        } finally {
            isLoading = false;
            if (loadMoreBtn) {
                loadMoreBtn.innerHTML = '<i class="fas fa-redo"></i> Загрузить ещё';
            }
        }
    }

    /**
     * Сбросить и перезагрузить с новым фильтром
     */
    function applyFilter(newFilters, scrollToResults) {
        if (newFilters.category !== undefined) currentCategory = newFilters.category;
        if (newFilters.search !== undefined) currentSearch = newFilters.search;
        if (newFilters.sort !== undefined) currentSort = newFilters.sort;

        offset = 0;
        hasMore = true;
        loadRecipes(scrollToResults !== false);
    }

    /**
     * Открыть страницу рецепта
     */
    window.openRecipe = function (id) {
        window.location.href = `recipe-detail.html?id=${id}`;
    };

    /**
     * Toggle избранного прямо из ленты
     */
    window.toggleFavoriteFromFeed = async function (recipeId, btnEl) {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = 'registration/login.html';
            return;
        }

        try {
            const response = await fetch(`${API_BASE}/recipes/${recipeId}/favorite`, {
                method: 'POST',
                headers: { 'Authorization': 'Bearer ' + token },
            });

            if (!response.ok) throw new Error('Ошибка');

            const data = await response.json();
            btnEl.classList.toggle('active', data.action === 'added');
        } catch (err) {
            console.error('[recipes-feed] Ошибка избранного:', err);
        }
    };

    /**
     * Toggle лайка прямо из ленты
     */
    window.toggleLikeFeed = async function (recipeId, btnEl) {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = 'registration/login.html';
            return;
        }

        try {
            btnEl.style.transform = 'scale(1.3)';
            setTimeout(() => { btnEl.style.transform = ''; }, 200);

            const response = await fetch(`${API_BASE}/recipes/${recipeId}/like`, {
                method: 'POST',
                headers: { 'Authorization': 'Bearer ' + token },
            });

            if (!response.ok) throw new Error('Ошибка');

            const data = await response.json();
            btnEl.classList.toggle('active', data.action === 'added');
        } catch (err) {
            console.error('[recipes-feed] Ошибка лайка:', err);
        }
    };

    /**
     * Экранирование HTML
     */
    function escapeHtml(str) {
        if (!str) return '';
        return String(str).replace(/[&<>"']/g, function (m) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
        });
    }

    // ====== ИНИЦИАЛИЗАЦИЯ ======

    // Загрузить первую порцию
    loadRecipes();

    // Кнопка «Загрузить ещё»
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', loadRecipes);
    }

    // ====== ФИЛЬТРЫ (кнопки над лентой) ======
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', function () {
            filterButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            const filterValue = this.dataset.filter;

            if (filterValue === 'popular') {
                // Сортировка по популярности
                applyFilter({ sort: 'popular', category: null, search: '' });
            } else if (filterValue === 'all') {
                // Сброс всех фильтров
                applyFilter({ sort: 'newest', category: null, search: '' });
            } else {
                // Фильтр по категории
                applyFilter({ sort: 'newest', category: filterValue, search: '' });
            }
        });
    });

    // ====== КАТЕГОРИИ ======
    document.querySelectorAll('.category-card').forEach(card => {
        card.addEventListener('click', function () {
            const category = this.dataset.category;
            if (!category) return;

            // Сброс активного фильтра
            filterButtons.forEach(b => b.classList.remove('active'));

            applyFilter({ category, search: '', sort: 'newest' }, true);
        });
    });

    // ====== ПОИСК ======
    const mainSearch = document.getElementById('mainSearch');
    const searchBtn = document.getElementById('searchBtn');

    function doSearch() {
        const query = mainSearch ? mainSearch.value.trim() : '';
        // Сброс фильтров
        filterButtons.forEach(b => b.classList.remove('active'));
        applyFilter({ search: query, category: null, sort: 'newest' }, true);
    }

    if (searchBtn) searchBtn.addEventListener('click', doSearch);
    if (mainSearch) {
        mainSearch.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                doSearch();
            }
        });
    }

    // ====== БЫСТРЫЕ ТЕГИ ======
    document.querySelectorAll('.quick-tags .tag').forEach(tag => {
        tag.addEventListener('click', function () {
            const searchQuery = this.dataset.search || '';
            if (mainSearch) mainSearch.value = searchQuery;

            filterButtons.forEach(b => b.classList.remove('active'));
            applyFilter({ search: searchQuery, category: null, sort: 'newest' }, true);
        });
    });
})();
