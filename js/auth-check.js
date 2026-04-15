/**
 * auth-check.js — v4 (финальная спецификация навигации)
 *
 * Desktop:
 *   Гость:      Главная | Избранное | Категории | Добавить рецепт | Войти | Регистрация
 *   Авторизован: Главная | Избранное | Категории | Добавить рецепт | [Аватар] Имя
 *
 * Mobile (бургер):
 *   Гость:       Главная | Избранное | Категории | Добавить рецепт | Профиль(→login) | Войти | Регистрация
 *   Авторизован: Главная | Избранное | Категории | Добавить рецепт | Профиль | [Аватар Имя] | [Красная] Выйти
 *
 * Защита: клик по Избранное/Добавить рецепт/Профиль без токена → редирект на login.html
 */

(function () {
    'use strict';

    const API_BASE = 'http://localhost:5000/api';

    // ====== СЕЛЕКТОРЫ ======

    /** Гостевые элементы */
    const GUEST_SELECTORS = [
        '#login-link',
        '#register-link',
        '.guest-only',
    ];

    /** Элементы авторизованного пользователя */
    const AUTH_SELECTORS = [
        '#nav-avatar-link',
        '#desktop-logout-btn',
        '.auth-only',
    ];

    /** Защищённые ссылки — блокировать для гостей */
    const PROTECTED_LINKS = [
        'a[href="favorites.html"]',
        'a[href="add-recipe.html"]',
        '.profile-link',
    ];

    // ====== УТИЛИТЫ ======

    function collectElements(selectors) {
        const set = new Set();
        selectors.forEach(sel => {
            document.querySelectorAll(sel).forEach(el => set.add(el));
        });
        return Array.from(set);
    }

    function hideElements(els) {
        els.forEach(el => {
            if (!el) return;
            el.classList.add('auth-hidden');
            el.setAttribute('aria-hidden', 'true');
        });
    }

    function showElements(els) {
        els.forEach(el => {
            if (!el) return;
            el.classList.remove('auth-hidden');
            el.removeAttribute('aria-hidden');
        });
    }

    // ====== CSS-класс ======

    const STYLE_ID = 'auth-check-styles';

    function injectStyles() {
        if (document.getElementById(STYLE_ID)) return;

        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = `
            .auth-hidden {
                display: none !important;
            }
            .btn-logout-mobile {
                color: #ff4d4d !important;
                font-weight: 600 !important;
                border-top: 1px solid rgba(255,77,77,0.2) !important;
                margin-top: 4px !important;
                padding-top: 14px !important;
            }
            .mobile-auth-info {
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 12px 15px;
                border-bottom: 1px solid var(--light-gray, #DFE6E9);
            }
            .mobile-auth-info img {
                width: 32px;
                height: 32px;
                border-radius: 50%;
                object-fit: cover;
            }
            .mobile-auth-info span {
                font-size: 0.95rem;
                font-weight: 500;
            }
        `;
        document.head.appendChild(style);
    }

    // ====== ОСНОВНАЯ ЛОГИКА ======

    /**
     * Показать гостевой UI
     */
    function showGuestUI() {
        showElements(collectElements(GUEST_SELECTORS));
        hideElements(collectElements(AUTH_SELECTORS));

        // Блокируем защищённые ссылки
        collectElements(PROTECTED_LINKS).forEach(link => {
            const clone = link.cloneNode(true);
            link.parentNode.replaceChild(clone, link);
            clone.addEventListener('click', function (e) {
                e.preventDefault();
                window.location.href = 'registration/login.html';
            });
        });

        // Перенаправляем ссылки "Избранное" на login для гостей
        document.querySelectorAll('a[href*="tab=favorites"]').forEach(link => {
            const clone = link.cloneNode(true);
            link.parentNode.replaceChild(clone, link);
            clone.addEventListener('click', function (e) {
                e.preventDefault();
                window.location.href = 'registration/login.html';
            });
        });
    }

    /**
     * Показать авторизованный UI
     */
    function showAuthUI(user) {
        hideElements(collectElements(GUEST_SELECTORS));
        showElements(collectElements(AUTH_SELECTORS));

        // Обновляем аватары
        document.querySelectorAll('#nav-avatar').forEach(img => {
            img.src = user.avatar_url;
            img.alt = user.username;
        });

        // Обновляем имена
        document.querySelectorAll('#nav-username').forEach(el => {
            el.textContent = user.username;
        });

        // Инициализируем бейдж уведомлений
        if (typeof updateNotifBadge === 'function') updateNotifBadge();
    }

    // ====== ВЫХОД ======

    function doLogout() {
        localStorage.removeItem('token');
        showGuestUI();
        // Если токен истёк — перенаправляем на главную (гостевой режим)
        if (window.location.pathname.includes('profile.html') ||
            window.location.pathname.includes('add-recipe.html')) {
            window.location.href = 'index.html';
        }
    }

    window.handleLogout = function () {
        if (confirm('Вы уверены, что хотите выйти?')) {
            localStorage.removeItem('token');
            window.location.href = 'index.html';
        }
    };

    // ====== API ======

    async function fetchMe() {
        const token = localStorage.getItem('token');
        if (!token) {
            console.log('[auth-check] Токен не найден — гость');
            return null;
        }

        try {
            const response = await fetch(`${API_BASE}/users/me`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            console.log('[auth-check] GET /users/me статус:', response.status);

            if (!response.ok) {
                if (response.status === 401) {
                    console.log('[auth-check] Токен невалиден — выход');
                }
                doLogout();
                return null;
            }

            const data = await response.json();
            console.log('[auth-check] Данные получены:', data.user.username);
            return data.user;
        } catch (err) {
            console.error('[auth-check] Ошибка сети:', err);
            return null;
        }
    }

    // ====== ЗАПУСК ======

    async function init() {
        injectStyles();
        const user = await fetchMe();

        if (user) {
            showAuthUI(user);
        } else {
            showGuestUI();
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
