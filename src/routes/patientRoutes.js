const express = require('express');
const { createPatient, getPatientById, listPatients } = require('../controllers/patientController');
const { authenticateUser, requireRole } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(authenticateUser);

router.post('/', requireRole('ASHA', 'ADMIN'), createPatient);
router.get('/', listPatients);
router.get('/:id', getPatientById);

module.exports = router;
