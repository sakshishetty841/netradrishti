const prisma = require('../config/prisma');

const getStats = async (req, res, next) => {
  try {
    const totalPatients = await prisma.patient.count();
    const totalScans = await prisma.scan.count();
    const completedScans = await prisma.scan.count({ where: { status: 'COMPLETED' } });
    const pendingScans = await prisma.scan.count({ where: { status: { in: ['UPLOADED', 'ANALYZING'] } } });
    const modelNotReadyScans = await prisma.scan.count({ where: { status: 'MODEL_NOT_READY' } });

    // Referrals count (scans with Moderate, Severe, or Proliferative DR)
    const referredScans = await prisma.scan.count({
      where: {
        status: 'COMPLETED',
        severity: { in: ['MODERATE', 'SEVERE', 'PROLIFERATIVE'] },
      },
    });

    // DR Severity distribution calculation from actual scans
    const severityGroups = await prisma.scan.groupBy({
      by: ['severity'],
      where: { status: 'COMPLETED' },
      _count: { severity: true },
    });

    const severityDistribution = {
      NO_DR: 0,
      MILD: 0,
      MODERATE: 0,
      SEVERE: 0,
      PROLIFERATIVE: 0,
    };

    severityGroups.forEach((group) => {
      if (group.severity && severityDistribution.hasOwnProperty(group.severity)) {
        severityDistribution[group.severity] = group._count.severity;
      }
    });

    // Region distribution from Patients
    const regionGroups = await prisma.patient.groupBy({
      by: ['region'],
      _count: { region: true },
    });

    const regionDistribution = regionGroups.map((r) => ({
      region: r.region,
      patientCount: r._count.region,
    }));

    return res.status(200).json({
      totalPatients,
      totalScans,
      completedScans,
      pendingScans,
      modelNotReadyScans,
      referredScans,
      severityDistribution,
      regionDistribution,
    });
  } catch (error) {
    next(error);
  }
};

const getAdminScans = async (req, res, next) => {
  try {
    const { search, status, severity } = req.query;

    const where = {};
    if (status) where.status = status;
    if (severity) where.severity = severity;
    if (search && search.trim()) {
      const q = search.trim();
      where.patient = {
        OR: [
          { name: { contains: q } },
          { patientCode: { contains: q } },
          { region: { contains: q } },
        ],
      };
    }

    const scans = await prisma.scan.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        patient: true,
        uploadedBy: {
          select: { id: true, name: true, role: true, email: true },
        },
      },
    });

    return res.status(200).json({ scans, count: scans.length });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStats,
  getAdminScans,
};
