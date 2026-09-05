const prisma = require('../config/prisma');

const createPatient = async (req, res, next) => {
  try {
    const { name, age, gender, region } = req.body;

    if (!name || !age || !gender || !region) {
      return res.status(400).json({ error: 'Patient name, age, gender, and region are required.' });
    }

    const ageNum = parseInt(age, 10);
    if (isNaN(ageNum) || ageNum <= 0 || ageNum > 120) {
      return res.status(400).json({ error: 'Please provide a valid age between 1 and 120.' });
    }

    const count = await prisma.patient.count();
    const patientCode = `PAT-${String(count + 1).padStart(5, '0')}`;

    const patient = await prisma.patient.create({
      data: {
        patientCode,
        name: name.trim(),
        age: ageNum,
        gender: gender.trim(),
        region: region.trim(),
        createdBy: req.user.id,
      },
    });

    console.log(`[PATIENT CREATED] ${patient.patientCode} by ASHA user ${req.user.id}`);

    return res.status(201).json({
      message: 'Patient registered successfully',
      patient,
    });
  } catch (error) {
    next(error);
  }
};

const getPatientById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const patient = await prisma.patient.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
        scans: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!patient) {
      return res.status(404).json({ error: 'Patient record not found.' });
    }

    return res.status(200).json({ patient });
  } catch (error) {
    next(error);
  }
};

const listPatients = async (req, res, next) => {
  try {
    const { search } = req.query;

    const where = {};
    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { name: { contains: q } },
        { patientCode: { contains: q } },
        { region: { contains: q } },
      ];
    }

    // ASHA workers see their own created patients first or all patients if doctor/admin
    if (req.user.role === 'ASHA') {
      where.createdBy = req.user.id;
    }

    const patients = await prisma.patient.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        scans: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    return res.status(200).json({ patients, count: patients.length });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPatient,
  getPatientById,
  listPatients,
};
