/**
 * Маршруты администратора
 * 
 * Все маршруты защищены middleware authorizeAdmin
 */

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const authorizeAdmin = require('../middleware/authorizeAdmin');
const adminController = require('../controllers/adminController');

// === Применяем оба middleware ко всем маршрутам ===
router.use(authMiddleware, authorizeAdmin);

// Статистика платформы
router.get('/stats', adminController.getStats);

// Получить всех пользователей
router.get('/users', adminController.getAllUsers);

// Изменить статус пользователя (active/banned)
router.patch('/users/:id/status', adminController.updateUserStatus);

// Изменить роль пользователя (user/admin)
router.patch('/users/:id/role', adminController.updateUserRole);

// Удалить пользователя
router.delete('/users/:id', adminController.deleteUser);

module.exports = router;
