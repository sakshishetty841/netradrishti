const express = require('express');
const { getStats, getAdminScans } = require('../controllers/adminController');
const { authenticateUser, requireRole } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(authenticateUser);
router.use(requireRole('ADMIN', 'PHC_DOCTOR'));

router.get('/stats', getStats);
router.get('/scans', getAdminScans);

module.exports = router;
