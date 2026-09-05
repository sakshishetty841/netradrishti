const express = require('express');
const { checkAiServiceHealth } = require('../services/aiClientService');

const router = express.Router();

router.get('/', async (req, res) => {
  const aiHealth = await checkAiServiceHealth();

  const isModelReady = aiHealth && aiHealth.model === 'READY';
  const isAiServiceOk = aiHealth && (aiHealth.status === 'OK' || aiHealth.status === 'HEALTHY');

  return res.status(200).json({
    backend: 'OK',
    aiService: isAiServiceOk ? 'OK' : 'OFFLINE',
    model: isModelReady ? 'READY' : 'NOT_READY',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
