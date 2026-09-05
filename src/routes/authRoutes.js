const express = require('express');
const { login, register, getMe } = require('../controllers/authController');
const { authenticateUser } = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/login', login);
router.post('/register', register);
router.get('/me', authenticateUser, getMe);

module.exports = router;
