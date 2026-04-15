/**
 * database/migrate.js
 */
const pool = require('./pool');
const fs = require('fs');
const path = require('path');

async function migrate() {
  try {
    const sql = fs.readFileSync(
      path.join(__dirname, 'schema.sql'),
      'utf8'
    );
    await pool.query(sql);
    console.log('✅ Миграция завершена успешно');
    process.exit(0);
  } catch (err) {
    console.error('❌ Ошибка миграции:', err.message);
    process.exit(1);
  }
}

migrate();
