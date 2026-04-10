# 📦 Code Quality — Установка

**Пошаговая инструкция по установке ESLint и Prettier**

---

## 🔧 Шаг 1: Установка Зависимостей

```bash
npm install -D eslint prettier eslint-config-prettier
```

**Что устанавливается:**
- `eslint` — линтер для JavaScript
- `prettier` — авто-форматировщик
- `eslint-config-prettier` — отключение конфликтующих правил ESLint

**Время установки:** ~10-15 секунд

---

## ⚙️ Шаг 2: Инициализация ESLint

```bash
npx eslint --init
```

**Ответь на вопросы:**

1. **How would you like to use ESLint?**
   → `To check syntax and find problems`

2. **What type of modules does your project use?**
   → `CommonJS (require/exports)`

3. **Which framework does your project use?**
   → `None of these`

4. **Does your project use TypeScript?**
   → `No`

5. **Where does your code run?**
   → `Browser`, `Node`

6. **What format do you want your config file to be in?**
   → `JSON`

**Будет создан файл:** `.eslintrc.json`

---

## 📝 Шаг 3: Создание Конфигурации Prettier

**Создай файл `.prettierrc`:**
```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
```

**Или создай через команду:**
```bash
echo '{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}' > .prettierrc
```

---

## 🎯 Шаг 4: Настройка package.json

**Добавь скрипты:**
```json
{
  "scripts": {
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "format": "prettier --write \"**/*.js\""
  }
}
```

**Использование:**
```bash
npm run lint       # Проверка
npm run lint:fix   # Проверка + исправление
npm run format     # Форматирование
```

---

## ✅ Шаг 5: Проверка Установки

**Создай тестовый файл `test-code-quality.js`:**
```javascript
const x=1
const y = 2
const z=3;

console.log('Result:', x+y+z )
```

**Запусти проверку:**
```bash
npx eslint test-code-quality.js
```

**Ожидаемый вывод:**
```
✖ 5 problems (5 errors, 0 warnings)
  5 errors and 0 warnings potentially fixable with the `--fix` option.
```

**Исправь автоматически:**
```bash
npx eslint test-code-quality.js --fix
```

**Проверь результат:**
```javascript
const x = 1;
const y = 2;
const z = 3;

console.log('Result:', x + y + z);
```

---

## 🎯 Быстрый Старт

**Проверка проекта:**
```bash
# Проверить все файлы
npm run lint

# Исправить ошибки
npm run lint:fix

# Отформатировать
npm run format
```

---

## 🐛 Возможные Проблемы

### Ошибка: "ESLint couldn't find a configuration file"

**Решение:**
```bash
npx eslint --init
```

### Ошибка: "Definition for rule 'prettier/prettier' was not found"

**Решение:**
```bash
npm install -D eslint-plugin-prettier
```

### Конфликт между ESLint и Prettier

**Решение:**
Убедись, что установлен `eslint-config-prettier` и добавлен в `.eslintrc.json`:

```json
{
  "extends": ["eslint:recommended", "prettier"]
}
```

---

## 📊 Интеграция с VS Code

**Установи расширения:**
1. **ESLint** (dbaeumer.vscode-eslint)
2. **Prettier - Code formatter** (esbenp.prettier-vscode)

**Настройки (`.vscode/settings.json`):**
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

**Теперь при сохранении файла:**
- ✅ Автоматическое форматирование
- ✅ Исправление ошибок ESLint

---

## 🔄 Обновление

```bash
# Обновить зависимости
npm update -D eslint prettier

# Проверить версии
npx eslint -v
npx prettier -v
```

---

**✅ Готово! Навык "Code Quality" активирован!** 🧹
