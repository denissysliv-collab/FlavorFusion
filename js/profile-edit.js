/**
 * profile-edit.js — редактирование профиля с выбором способа аватара
 *
 * Возможности:
 * 1. Загрузка данных профиля из БД при открытии страницы
 * 2. Переключение между ссылкой и файлом для аватара
 * 3. Предпросмотр аватара (оба способа)
 * 4. Сохранение через PATCH /api/users/me
 * 5. Мгновенное обновление шапки без перезагрузки страницы
 *
 * Аватар файл конвертируется в base64 Data URL для превью и хранения.
 */

(function () {
    'use strict';

    const API_BASE = 'http://localhost:5000/api';

    // ====== DOM-элементы ======
    const form = document.getElementById('settingsForm');
    const usernameInput = document.getElementById('settingsUsername');
    const emailInput = document.getElementById('settingsEmail');
    const avatarInput = document.getElementById('settingsAvatar');
    const avatarFileInput = document.getElementById('settingsAvatarFile');
    const bioInput = document.getElementById('settingsBio');
    const avatarImg = document.getElementById('settingsAvatarImg');
    const saveBtn = document.getElementById('settingsSaveBtn');
    const messageEl = document.getElementById('settingsMessage');
    const avatarFileName = document.getElementById('avatarFileName');

    if (!form) return;

    // Текущий метод аватара: 'link' или 'file'
    let avatarMethod = 'link';
    // Base64 данные загруженного файла
    let avatarFileDataUrl = null;

    // ====== ГЛОБАЛЬНЫЕ ФУНКЦИИ (для onclick в HTML) ======

    /**
     * Переключить метод аватара (ссылка / файл)
     */
    window.switchAvatarMethod = function (method) {
        avatarMethod = method;

        const linkBtn = document.getElementById('avatarLinkBtn');
        const fileBtn = document.getElementById('avatarFileBtn');
        const linkSection = document.getElementById('avatarLinkSection');
        const fileSection = document.getElementById('avatarFileSection');

        if (method === 'link') {
            linkBtn.classList.add('active');
            fileBtn.classList.remove('active');
            linkSection.style.display = 'block';
            fileSection.style.display = 'none';
        } else {
            fileBtn.classList.add('active');
            linkBtn.classList.remove('active');
            fileSection.style.display = 'block';
            linkSection.style.display = 'none';
        }
    };

    /**
     * Обработка загрузки файла
     */
    window.handleAvatarFile = function (input) {
        const file = input.files[0];
        if (!file) return;

        // Проверка типа файла
        if (!file.type.startsWith('image/')) {
            showAvatarMessage('Выберите изображение', 'error');
            return;
        }

        // Проверка размера (макс 5 МБ)
        if (file.size > 5 * 1024 * 1024) {
            showAvatarMessage('Файл слишком большой. Максимум 5 МБ', 'error');
            return;
        }

        // Читаем файл как Data URL (base64)
        const reader = new FileReader();
        reader.onload = function (e) {
            avatarFileDataUrl = e.target.result;

            // Показываем имя файла
            avatarFileName.textContent = '📎 ' + file.name + ' (' + (file.size / 1024).toFixed(1) + ' КБ)';

            // Превью
            updateAvatarPreview(avatarFileDataUrl);
        };
        reader.readAsDataURL(file);
    };

    // ====== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ======

    /**
     * Показать сообщение под формой
     */
    function showAvatarMessage(text, type) {
        messageEl.textContent = text;
        messageEl.style.display = 'block';
        messageEl.style.color = type === 'success'
            ? 'var(--success-color, #00B894)'
            : 'var(--danger-color, #D63031)';
        setTimeout(() => { messageEl.style.display = 'none'; }, 4000);
    }

    /**
     * Обновить превью аватара
     */
    function updateAvatarPreview(url) {
        if (url && url.length > 0) {
            avatarImg.src = url;
            avatarImg.style.display = 'block';
        } else {
            avatarImg.style.display = 'none';
            avatarImg.src = '';
        }
    }

    /**
     * Обновить шапку и профиль новыми данными
     */
    function updateHeaderUI(user) {
        // Аватар
        document.querySelectorAll('#nav-avatar').forEach(img => {
            img.src = user.avatar_url;
            img.alt = user.username;
        });

        // Имя
        document.querySelectorAll('#nav-username').forEach(el => {
            el.textContent = user.username;
        });

        // Аватар в шапке профиля
        const profileAvatar = document.getElementById('profileAvatar');
        if (profileAvatar) profileAvatar.src = user.avatar_url;

        // Имя в профиле
        const profileName = document.getElementById('profileName');
        if (profileName) profileName.textContent = user.username;

        // Био в профиле
        const profileBio = document.getElementById('profileBio');
        if (profileBio) profileBio.textContent = user.bio || '';
    }

    // ====== ЗАГРУЗКА ДАННЫХ ======

    async function loadProfile() {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = 'registration/login.html';
            return;
        }

        try {
            const response = await fetch(`${API_BASE}/users/me`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (!response.ok) {
                if (response.status === 401) {
                    localStorage.removeItem('token');
                    window.location.href = 'registration/login.html';
                    return;
                }
                throw new Error('Ошибка загрузки профиля');
            }

            const data = await response.json();
            const user = data.user;

            // Предзаполняем форму
            usernameInput.value = user.username || '';
            emailInput.value = user.email || '';
            avatarInput.value = user.avatar_url || '';
            bioInput.value = user.bio || '';

            // Превью аватара
            if (user.avatar_url && user.avatar_url.length > 0) {
                updateAvatarPreview(user.avatar_url);
            }

        } catch (err) {
            console.error('[profile-edit] Ошибка:', err);
            showAvatarMessage('Не удалось загрузить данные профиля', 'error');
        }
    }

    // ====== СОХРАНЕНИЕ ======

    async function saveProfile(e) {
        e.preventDefault();

        const token = localStorage.getItem('token');
        if (!token) return;

        const username = usernameInput.value.trim();
        const bio = bioInput.value.trim();

        // Определяем avatar_url в зависимости от метода
        let avatar_url = '';
        if (avatarMethod === 'link') {
            avatar_url = avatarInput.value.trim();
        } else if (avatarMethod === 'file' && avatarFileDataUrl) {
            avatar_url = avatarFileDataUrl; // base64 data URL
        }

        // Валидация
        if (username.length < 3) {
            showAvatarMessage('Имя должно быть минимум 3 символа', 'error');
            usernameInput.focus();
            return;
        }

        // Блокируем кнопку
        const originalText = saveBtn.innerHTML;
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Сохранение...';
        saveBtn.disabled = true;

        try {
            // Формируем payload: только непустые поля
            const payload = { username };
            if (avatar_url.length > 0) payload.avatar_url = avatar_url;
            if (bio.length > 0) payload.bio = bio;

            const response = await fetch(`${API_BASE}/users/me`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Ошибка сохранения');
            }

            const updatedUser = data.user;

            // Обновляем превью
            updateAvatarPreview(updatedUser.avatar_url);

            // Мгновенно обновляем шапку и профиль
            updateHeaderUI(updatedUser);

            showAvatarMessage('Профиль успешно обновлён', 'success');

        } catch (err) {
            console.error('[profile-edit] Ошибка сохранения:', err);
            showAvatarMessage(err.message || 'Не удалось сохранить изменения', 'error');
        } finally {
            saveBtn.innerHTML = originalText;
            saveBtn.disabled = false;
        }
    }

    // ====== ИНИЦИАЛИЗАЦИЯ ======

    loadProfile();
    form.addEventListener('submit', saveProfile);

    // Превью аватара при вводе URL
    avatarInput.addEventListener('input', function () {
        updateAvatarPreview(this.value.trim());
    });
})();
