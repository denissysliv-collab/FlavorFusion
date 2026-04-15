/**
 * Подключение к PostgreSQL
 * Создаёт и экспортирует pool соединений для переиспользования
 */
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'flavorfusion',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
});

// Проверка подключения при старте
pool.on('connect', () => {
  console.log('✓ Подключено к PostgreSQL');
});

pool.on('error', (err) => {
  console.error('✗ Ошибка подключения к БД:', err.message);
});

module.exports = pool;
