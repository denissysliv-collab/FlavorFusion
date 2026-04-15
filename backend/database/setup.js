/**
 * database/setup.js — полная автоматизация инициализации БД
 *
 * Что делает:
 * 1. Подключается к системной БД postgres
 * 2. Создаёт flavorfusion, если её нет
 * 3. Переподключается к flavorfusion
 * 4. Выполняет schema.sql (таблицы, индексы, триггеры)
 *
 * Запуск: npm run init-db
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const DB_NAME = process.env.DB_NAME || 'flavorfusion';
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || 5432;
const DB_USER = process.env.DB_USER || 'postgres';
const DB_PASS = process.env.DB_PASSWORD || '';

// ====== Шаг 1: Подключиться к системной БД postgres и создать flavorfusion ======

async function ensureDatabase() {
  // Подключаемся к postgres (системная БД, есть всегда)
  const sysPool = new Pool({
    host: DB_HOST,
    port: DB_PORT,
    database: 'postgres',
    user: DB_USER,
    password: DB_PASS,
  });

  try {
    // Проверяем, существует ли БД
    const { rows } = await sysPool.query(
      'SELECT datname FROM pg_database WHERE datname = $1',
      [DB_NAME]
    );

    if (rows.length === 0) {
      // БД нет — создаём
      await sysPool.query(`CREATE DATABASE "${DB_NAME}"`);
      console.log(`✅ Database "${DB_NAME}" created`);
    } else {
      console.log(`✅ Database "${DB_NAME}" already exists`);
    }
  } catch (err) {
    console.error(`❌ Failed to create database: ${err.message}`);
    process.exit(1);
  } finally {
    await sysPool.end();
  }
}

// ====== Шаг 2: Подключиться к flavorfusion и выполнить schema.sql ======

async function runMigrations() {
  // Теперь подключаемся к целевой БД
  const dbPool = new Pool({
    host: DB_HOST,
    port: DB_PORT,
    database: DB_NAME,
    user: DB_USER,
    password: DB_PASS,
  });

  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');

    await dbPool.query(sql);
    console.log('✅ Tables created successfully');
  } catch (err) {
    console.error(`❌ Migration failed: ${err.message}`);
    process.exit(1);
  } finally {
    await dbPool.end();
  }
}

// ====== Запуск ======

(async function main() {
  console.log('\n🔧 Setting up database...\n');
  await ensureDatabase();
  await runMigrations();
  console.log('\n🎉 Database is ready!\n');
  process.exit(0);
})();
