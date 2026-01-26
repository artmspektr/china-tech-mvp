const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken } = require('../middleware/auth');

// Публичные маршруты
router.post('/register', userController.register);
router.post('/login', userController.login);

// Защищенные маршруты (требуют аутентификации)
router.get('/profile', authenticateToken, userController.getProfile);
router.put('/profile', authenticateToken, userController.updateProfile);

module.exports = router;