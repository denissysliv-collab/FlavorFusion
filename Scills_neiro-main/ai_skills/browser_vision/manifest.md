# 👁️ Browser Vision — "Глаза" ИИ

**Навык:** Автоматическое тестирование веб-интерфейсов через браузер

---

## 🎯 Назначение

Этот навык дает ИИ возможность:
- **Видеть** веб-страницы как реальный пользователь
- **Проверять** вёрстку и отображение элементов
- **Находить** ошибки в консоли браузера
- **Тестировать** адаптивность на разных устройствах
- **Делать** скриншоты для анализа

---

## 🎯 Триггеры для Использования

**Используй этот навык, когда:**

1. **Проверка вёрстки**
   - "Проверь, что все элементы видны"
   - "Есть ли горизонтальная прокрутка?"
   - "Какой размер шрифта заголовка?"

2. **Поиск ошибок**
   - "Проверь консоль на ошибки"
   - "Есть ли предупреждения в браузере?"
   - "Почему кнопка не работает?"

3. **Эмуляция мобильных**
   - "Как выглядит на iPhone 13?"
   - "Проверь на ширине 390px"
   - "Тест мобильной версии"

4. **Скриншоты**
   - "Сделай скриншот страницы"
   - "Покажи, как выглядит кнопка"
   - "Задокументируй текущее состояние"

---

## 📦 Зависимости

- **Playwright** — движок для управления браузером
- **Chromium** — браузер для тестирования

**Установка:**
```bash
npm install -D @playwright/test
npx playwright install chromium
```

---

## 🚀 Быстрый Старт

**Создать тест:**
```bash
# Скопировать template.js
cp .ai_skills/browser_vision/template.js my_test.js

# Запустить
node my_test.js
```

**Базовый пример:**
```javascript
const { chromium } = require('playwright');
const path = require('path');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    await page.goto('http://localhost:3000/');
    await page.screenshot({ path: 'screenshot.png' });
    
    await browser.close();
})();
```

---

## 📊 Примеры Использования

### 1. Проверка видимости элемента
```javascript
const h1 = await page.$('h1');
if (h1) {
    const text = await h1.textContent();
    console.log('Заголовок:', text);
}
```

### 2. Проверка консоли
```javascript
const errors = [];
page.on('console', msg => {
    if (msg.type() === 'error') {
        errors.push(msg.text());
    }
});
```

### 3. Эмуляция iPhone
```javascript
const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true
});
```

---

## 📁 Файлы Навыка

| Файл | Описание |
|------|----------|
| `manifest.md` | Этот файл (описание навыка) |
| `setup.md` | Инструкция по установке |
| `template.js` | Универсальный шаблон теста |

---

**🤖 Навык готов к использованию в любом проекте!**
