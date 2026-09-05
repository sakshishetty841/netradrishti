const express = require('express');
const { uploadScan, analyzeScan, getScanById, listScans } = require('../controllers/scanController');
const { authenticateUser, requireRole } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

const router = express.Router();

router.use(authenticateUser);

router.post('/', requireRole('ASHA', 'ADMIN'), upload.single('image'), uploadScan);
router.post('/:id/analyze', analyzeScan);
router.get('/', listScans);
router.get('/:id', getScanById);

module.exports = router;
