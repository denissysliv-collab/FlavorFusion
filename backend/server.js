/**
 * Главный файл сервера
 * Настраивает middleware, маршруты и запускает Express
 */
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// ======================== MIDDLEWARE ========================

// Разрешаем запросы с фронтенда (CORS)
app.use(cors({
  origin: '*', // В production заменить на конкретный домен
  credentials: true,
}));

// Парсинг JSON-тел запросов
app.use(express.json({ limit: '10mb' }));

// Логирование запросов (только в development)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ======================== МАРШРУТЫ ========================

// Маршруты авторизации (register, login)
app.use('/api/auth', require('./routes/auth'));

// Публичные и защищённые маршруты пользователей
app.use('/api/users', require('./routes/users'));

// Публичные и защищённые маршруты рецептов
app.use('/api/recipes', require('./routes/recipes'));

// Проверка здоровья сервера
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Обработка несуществующих маршрутов
app.use((req, res) => {
  res.status(404).json({ error: 'Маршрут не найден' });
});

// Глобальная обработка ошибок
app.use((err, req, res, _next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Внутренняя ошибка сервера',
  });
});

// ======================== ЗАПУСК ========================
app.listen(PORT, () => {
  console.log(`\n🚀 Сервер запущен на http://localhost:${PORT}`);
  console.log(`📌 Режим: ${process.env.NODE_ENV || 'development'}\n`);
});

module.exports = app;
