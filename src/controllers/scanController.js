const path = require('path');
const fs = require('fs');
const prisma = require('../config/prisma');
const { predictRetinalScan } = require('../services/aiClientService');

const uploadScan = async (req, res, next) => {
  try {
    const { patientId } = req.body;

    if (!patientId) {
      return res.status(400).json({ error: 'Patient ID is required.' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No retinal image uploaded. Please attach an image file.' });
    }

    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      // Remove uploaded file if patient not found
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({ error: 'Patient not found.' });
    }

    const relativePath = `/uploads/originals/${path.basename(req.file.path)}`;

    const scan = await prisma.scan.create({
      data: {
        patientId: patient.id,
        uploadedById: req.user.id,
        originalImageUrl: relativePath,
        status: 'UPLOADED',
      },
      include: {
        patient: true,
      },
    });

    console.log(`[SCAN UPLOADED] Scan ID ${scan.id} for patient ${patient.patientCode}`);

    return res.status(201).json({
      message: 'Retinal image uploaded successfully. Scan status set to UPLOADED.',
      scan,
    });
  } catch (error) {
    next(error);
  }
};

const getRecommendation = (severity) => {
  switch (severity) {
    case 'NO_DR':
      return 'Routine annual follow-up according to standard clinical guidance for diabetic patients.';
    case 'MILD':
      return 'Routine ophthalmologist follow-up recommended within 6 to 12 months.';
    case 'MODERATE':
      return 'Ophthalmologist review recommended within 4 to 6 weeks for detailed fundus examination.';
    case 'SEVERE':
      return 'Prompt ophthalmologist review recommended within 2 weeks.';
    case 'PROLIFERATIVE':
      return 'Urgent ophthalmologist evaluation recommended immediately for anti-VEGF or laser treatment assessment.';
    default:
      return 'Consult an ophthalmologist for detailed clinical evaluation.';
  }
};

const analyzeScan = async (req, res, next) => {
  try {
    const { id } = req.params;

    const scan = await prisma.scan.findUnique({
      where: { id },
      include: { patient: true },
    });

    if (!scan) {
      return res.status(404).json({ error: 'Scan record not found.' });
    }

    // Determine absolute path of original image
    const relativePath = scan.originalImageUrl;
    const filename = path.basename(relativePath);
    const absoluteImagePath = path.resolve(process.env.UPLOAD_DIR || './uploads', 'originals', filename);

    if (!fs.existsSync(absoluteImagePath)) {
      return res.status(404).json({ error: 'Original image file is missing from storage.' });
    }

    // Update status to ANALYZING
    await prisma.scan.update({
      where: { id },
      data: { status: 'ANALYZING' },
    });

    console.log(`[SCAN ANALYZING] Requesting AI inference for scan ID ${id}...`);

    // Call Python FastAPI AI service
    const aiResponse = await predictRetinalScan(absoluteImagePath);

    if (aiResponse.status === 'MODEL_NOT_READY') {
      const updatedScan = await prisma.scan.update({
        where: { id },
        data: {
          status: 'MODEL_NOT_READY',
          explanationText: aiResponse.message || 'The diabetic retinopathy model has not been trained or loaded yet.',
        },
      });

      return res.status(200).json({
        message: 'AI Model is not ready.',
        scan: updatedScan,
      });
    }

    if (aiResponse.status === 'IMAGE_QUALITY_FAILED') {
      const updatedScan = await prisma.scan.update({
        where: { id },
        data: {
          status: 'IMAGE_QUALITY_FAILED',
          explanationText: aiResponse.message || 'The retinal image quality is insufficient for reliable screening.',
        },
      });

      return res.status(200).json({
        message: 'Image quality check failed.',
        scan: updatedScan,
      });
    }

    if (aiResponse.status !== 'COMPLETED') {
      const updatedScan = await prisma.scan.update({
        where: { id },
        data: {
          status: 'FAILED',
          explanationText: aiResponse.message || 'AI inference failed during analysis.',
        },
      });

      return res.status(500).json({
        error: 'AI analysis failed.',
        scan: updatedScan,
      });
    }

    // Map completed response
    const severityMap = ['NO_DR', 'MILD', 'MODERATE', 'SEVERE', 'PROLIFERATIVE'];
    const predictedClass = typeof aiResponse.predictedClass === 'number' ? aiResponse.predictedClass : 0;
    const severity = aiResponse.severity || severityMap[predictedClass] || 'NO_DR';
    const confidence = parseFloat(aiResponse.confidence) || 0.0;
    const recommendationText = getRecommendation(severity);

    const updatedScan = await prisma.scan.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        predictedClass,
        severity,
        confidence,
        heatmapImageUrl: aiResponse.heatmapPath || null,
        explanationText: aiResponse.explanationText || `AI model classified image as ${severity} with ${(confidence * 100).toFixed(1)}% confidence.`,
        recommendationText,
        modelVersion: aiResponse.modelVersion || 'DR-EfficientNet-B0-v1',
        analyzedAt: new Date(),
      },
      include: { patient: true },
    });

    console.log(`[SCAN COMPLETED] Scan ID ${id} -> Severity: ${severity}, Confidence: ${confidence}`);

    return res.status(200).json({
      message: 'AI screening analysis completed successfully.',
      scan: updatedScan,
    });
  } catch (error) {
    next(error);
  }
};

const getScanById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const scan = await prisma.scan.findUnique({
      where: { id },
      include: {
        patient: true,
        uploadedBy: {
          select: { id: true, name: true, role: true, email: true },
        },
      },
    });

    if (!scan) {
      return res.status(404).json({ error: 'Scan not found.' });
    }

    return res.status(200).json({ scan });
  } catch (error) {
    next(error);
  }
};

const listScans = async (req, res, next) => {
  try {
    const { patientId, status, severity } = req.query;

    const where = {};
    if (patientId) where.patientId = patientId;
    if (status) where.status = status;
    if (severity) where.severity = severity;

    // ASHA sees only scans they uploaded or for their patients
    if (req.user.role === 'ASHA') {
      where.uploadedById = req.user.id;
    }

    const scans = await prisma.scan.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        patient: true,
        uploadedBy: {
          select: { id: true, name: true, role: true },
        },
      },
    });

    return res.status(200).json({ scans, count: scans.length });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadScan,
  analyzeScan,
  getScanById,
  listScans,
};
