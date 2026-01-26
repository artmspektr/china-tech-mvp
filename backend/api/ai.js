const express = require('express');
const router = express.Router();
const aiController = require('../ai-services/controllers/aiController');
const { authenticateToken } = require('../middleware/auth');

// Маршруты для ИИ-сервисов (требуют аутентификации)
router.post('/process', authenticateToken, aiController.processAIRequest);
router.get('/status', authenticateToken, aiController.getAIStatus);
router.post('/model/:modelId', authenticateToken, aiController.queryAIModel);

module.exports = router;