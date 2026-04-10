# 📦 Browser Vision — Установка

**Пошаговая инструкция по установке Playwright и Chromium**

---

## 🔧 Шаг 1: Установка Playwright

```bash
npm install -D @playwright/test
```

**Что устанавливается:**
- `@playwright/test` — фреймворк для тестирования
- Зависимости для управления браузером

**Время установки:** ~10-15 секунд

---

## 🌐 Шаг 2: Установка Браузеров

```bash
npx playwright install chromium
```

**Что скачивается:**
- **Chromium** — основной браузер (172.8 MiB)
- **Chrome Headless Shell** — облегченная версия (108.8 MiB)
- **FFmpeg** — для работы с видео (1.3 MiB)
- **Winldd** — системная утилита (0.1 MiB)

**Время скачивания:** ~1-2 минуты (зависит от интернета)

**Путь установки:**
```
C:\Users\<User>\AppData\Local\ms-playwright\
```

---

## ✅ Шаг 3: Проверка Установки

**Создай тестовый файл `test-install.js`:**
```javascript
const { chromium } = require('playwright');

(async () => {
    console.log('🚀 Проверка установки...');
    
    const browser = await chromium.launch({ headless: true });
    console.log('✅ Браузер запущен');
    
    const page = await browser.newPage();
    console.log('✅ Страница создана');
    
    await page.goto('https://example.com');
    console.log('✅ Страница загружена');
    
    const title = await page.title();
    console.log('📝 Заголовок:', title);
    
    await browser.close();
    console.log('✅ Тест пройден!');
})();
```

**Запусти:**
```bash
node test-install.js
```

**Ожидаемый вывод:**
```
🚀 Проверка установки...
✅ Браузер запущен
✅ Страница создана
✅ Страница загружена
📝 Заголовок: Example Domain
✅ Тест пройден!
```

---

## 🎯 Быстрый Старт

**Используй template.js:**
```bash
# Скопируй шаблон
copy .ai_skills\browser_vision\template.js my_first_test.js

# Запусти
node my_first_test.js
```

---

## 🐛 Возможные Проблемы

### Ошибка: "Cannot find module 'playwright'"

**Решение:**
```bash
npm install
```

### Ошибка: "Browser not downloaded"

**Решение:**
```bash
npx playwright install chromium
```

### Ошибка: "Port 3000 already in use"

**Решение:**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /F /PID <номер_процесса>
```

---

## 📊 Требования

| Компонент | Минимум | Рекомендуется |
|-----------|---------|---------------|
| **Node.js** | 16+ | 20+ |
| **RAM** | 2 GB | 4 GB |
| **Место на диске** | 500 MB | 1 GB |
| **Интернет** | Для скачивания браузеров | — |

---

## 🔄 Обновление

```bash
# Обновить Playwright
npm update @playwright/test

# Переустановить браузеры
npx playwright install chromium --force
```

---

**✅ Готово! Навык "Browser Vision" активирован!** 👁️
