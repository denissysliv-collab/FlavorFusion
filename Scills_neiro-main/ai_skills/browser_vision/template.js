/**
 * Browser Vision Template
 * Универсальный шаблон для тестирования веб-страниц
 * 
 * Использование:
 *   node template.js [URL]
 * 
 * Пример:
 *   node template.js http://localhost:3000/
 */

const { chromium } = require('playwright');
const path = require('path');

// Конфигурация
const config = {
    url: process.argv[2] || 'http://localhost:3000/',
    viewport: { width: 1920, height: 1080 },
    screenshot: 'screenshot_' + Date.now() + '.png',
    headless: true
};

(async () => {
    console.log('👁️ Browser Vision — Запуск...\n');
    console.log('📖 URL:', config.url);
    console.log('📐 Viewport:', config.viewport.width, 'x', config.viewport.height);
    console.log('');
    
    let browser;
    
    try {
        // Запуск браузера
        console.log('🚀 Запуск браузера...');
        browser = await chromium.launch({
            headless: config.headless
        });
        
        // Создание контекста и страницы
        console.log('📄 Создание страницы...');
        const context = await browser.newContext({
            viewport: config.viewport
        });
        const page = await context.newPage();
        
        // Сбор логов консоли
        const consoleErrors = [];
        const consoleWarnings = [];
        
        page.on('console', msg => {
            const type = msg.type();
            const text = msg.text();
            
            if (type === 'error') {
                consoleErrors.push(text);
                console.log('❌ ERROR:', text);
            } else if (type === 'warning') {
                consoleWarnings.push(text);
                console.log('⚠️ WARNING:', text);
            }
        });
        
        // Загрузка страницы
        console.log('📖 Загрузка страницы...');
        await page.goto(config.url, { 
            waitUntil: 'networkidle',
            timeout: 10000
        });
        console.log('✅ Страница загружена\n');
        
        // Скриншот
        console.log('📸 Скриншот...');
        const screenshotPath = path.join(__dirname, config.screenshot);
        await page.screenshot({ 
            path: screenshotPath,
            fullPage: true
        });
        console.log('✅ Сохранен:', config.screenshot);
        console.log('');
        
        // Проверка заголовка
        console.log('🔍 Проверка элементов...');
        const h1 = await page.$('h1');
        if (h1) {
            const h1Text = await h1.textContent();
            console.log('✅ H1 найден:', h1Text.trim());
        } else {
            console.log('❌ H1 НЕ найден');
        }
        
        // Проверка навигации
        const nav = await page.$('nav');
        if (nav) {
            console.log('✅ Навигация найдена');
        } else {
            console.log('⚠️ Навигация НЕ найдена');
        }
        
        // Итоги
        console.log('');
        console.log('═══════════════════════════════════════════════');
        console.log('📊 ОТЧЁТ');
        console.log('═══════════════════════════════════════════════');
        console.log('❌ Ошибок:', consoleErrors.length);
        console.log('⚠️ Предупреждений:', consoleWarnings.length);
        console.log('');
        
        if (consoleErrors.length > 0) {
            console.log('📋 Список ошибок:');
            consoleErrors.forEach((err, i) => {
                console.log(`  ${i + 1}. ${err}`);
            });
            console.log('');
        }
        
        console.log('✨ Тест завершен успешно!');
        
    } catch (error) {
        console.error('❌ Ошибка:', error.message);
        console.error('');
        console.error('Возможно:');
        console.error('  • Сервер не запущен');
        console.error('  • Неверный URL');
        console.error('  • Проблема с сетью');
    } finally {
        // Закрытие браузера
        if (browser) {
            await browser.close();
            console.log('👋 Браузер закрыт');
        }
    }
})();
