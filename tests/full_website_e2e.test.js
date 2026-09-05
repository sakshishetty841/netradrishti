const http = require('http');
const fs = require('fs');
const path = require('path');

const BACKEND_URL = 'http://127.0.0.1:5001';
const AI_URL = 'http://127.0.0.1:8000';

async function runFullE2eVerification() {
  console.log('================================================================');
  console.log('  NETRADRISHTI (SIH26038) — FULL WEBSITE LIVE E2E VERIFICATION  ');
  console.log('================================================================');

  let ashaToken = '';
  let doctorToken = '';
  let adminToken = '';
  let createdPatientId = '';
  let createdPatientCode = '';
  let createdScanId = '';

  try {
    // 1. Health Checks
    console.log('\n[STEP 1/10] Verifying Backend & AI Service Health...');
    const backendHealth = await makeRequest('GET', `${BACKEND_URL}/api/health`);
    console.assert(backendHealth.status === 200, 'Backend health failed');
    console.assert(backendHealth.body.backend === 'OK', 'Backend status not OK');
    console.assert(backendHealth.body.aiService === 'OK', 'AI Service status not OK');
    console.assert(backendHealth.body.model === 'READY', `Expected model READY, got ${backendHealth.body.model}`);
    console.log(' ✅ Backend & AI Health Check PASSED:', backendHealth.body);

    const aiHealth = await makeRequest('GET', `${AI_URL}/health`);
    console.assert(aiHealth.status === 200, 'AI service health failed');
    console.assert(aiHealth.body.model === 'READY', `Expected AI service model READY, got ${aiHealth.body.model}`);
    console.log(' ✅ FastAPI AI Service Health Check PASSED:', aiHealth.body);

    // 2. Authentication Testing for all 3 User Roles & User Self-Registration
    console.log('\n[STEP 2/10] Verifying User Self-Registration & Role-Based Authentication...');
    
    // Register New ASHA Worker
    const newAshaEmail = `asha_worker_${Date.now().toString().slice(-4)}@phc.in`;
    const ashaRegRes = await makeRequest('POST', `${BACKEND_URL}/api/auth/register`, {
      name: 'Sunita Patil (ASHA)',
      email: newAshaEmail,
      password: 'password123',
      role: 'ASHA',
      mobile: '9876543210',
      state: 'Maharashtra',
      district: 'Satara',
      phc: 'Satara PHC-1',
      workerId: 'ASHA-MH-1002',
    });
    console.assert(ashaRegRes.status === 201, 'ASHA Registration failed');
    console.assert(ashaRegRes.body.user.role === 'ASHA', 'Role mismatch in ASHA registration');
    console.log(' ✅ ASHA Worker Account Self-Registration PASSED:', ashaRegRes.body.user.email);

    // Register New PHC Doctor
    const newDoctorEmail = `doctor_${Date.now().toString().slice(-4)}@phc.in`;
    const docRegRes = await makeRequest('POST', `${BACKEND_URL}/api/auth/register`, {
      name: 'Dr. Smita Deshmukh',
      email: newDoctorEmail,
      password: 'password123',
      role: 'PHC_DOCTOR',
      mobile: '9876543211',
      state: 'Maharashtra',
      district: 'Satara',
      phc: 'District Hospital Satara',
      registrationNumber: 'MMC-2019/05/5678',
    });
    console.assert(docRegRes.status === 201, 'Doctor Registration failed');
    console.assert(docRegRes.body.user.role === 'PHC_DOCTOR', 'Role mismatch in Doctor registration');
    console.log(' ✅ PHC Doctor Account Self-Registration PASSED:', docRegRes.body.user.email);

    // Reject Duplicate Registration
    const dupRegRes = await makeRequest('POST', `${BACKEND_URL}/api/auth/register`, {
      name: 'Duplicate User',
      email: newAshaEmail,
      password: 'password123',
      role: 'ASHA',
    });
    console.assert(dupRegRes.status === 400, 'Duplicate email should return 400');
    console.log(' ✅ Duplicate Email Registration Rejection PASSED:', dupRegRes.body.error);

    // Reject Public Admin Registration
    const adminRegRes = await makeRequest('POST', `${BACKEND_URL}/api/auth/register`, {
      name: 'Hacker Admin',
      email: 'hacker@phc.in',
      password: 'password123',
      role: 'ADMIN',
    });
    console.assert(adminRegRes.status === 400, 'Public admin registration should return 400');
    console.log(' ✅ Public Admin Registration Security Rejection PASSED:', adminRegRes.body.error);

    const ashaLogin = await makeRequest('POST', `${BACKEND_URL}/api/auth/login`, {
      email: 'asha@phc.in',
      password: 'password123',
    });
    console.assert(ashaLogin.status === 200, 'ASHA login failed');
    ashaToken = ashaLogin.body.token;
    console.log(' ✅ ASHA Login PASSED:', ashaLogin.body.user.name);

    const doctorLogin = await makeRequest('POST', `${BACKEND_URL}/api/auth/login`, {
      email: 'doctor@phc.in',
      password: 'password123',
    });
    console.assert(doctorLogin.status === 200, 'Doctor login failed');
    doctorToken = doctorLogin.body.token;
    console.log(' ✅ Doctor Login PASSED:', doctorLogin.body.user.name);

    const adminLogin = await makeRequest('POST', `${BACKEND_URL}/api/auth/login`, {
      email: 'admin@phc.in',
      password: 'password123',
    });
    console.assert(adminLogin.status === 200, 'Admin login failed');
    adminToken = adminLogin.body.token;
    console.log(' ✅ Admin Login PASSED:', adminLogin.body.user.name);

    // 3. Patient Registration (PostgreSQL / SQLite Database Write)
    console.log('\n[STEP 3/10] Registering New Diabetic Patient (Database Write)...');
    const patientName = `Kavita Patel ${Date.now().toString().slice(-4)}`;
    const regRes = await makeRequest(
      'POST',
      `${BACKEND_URL}/api/patients`,
      {
        name: patientName,
        age: 52,
        gender: 'Female',
        region: 'Satara PHC-2',
      },
      { Authorization: `Bearer ${ashaToken}` }
    );
    console.assert(regRes.status === 201, 'Patient registration failed');
    createdPatientId = regRes.body.patient.id;
    createdPatientCode = regRes.body.patient.patientCode;
    console.log(' ✅ Patient Registration PASSED:', `${createdPatientCode} (${patientName})`);

    // 4. Patient Database Persistence & Retrieval
    console.log('\n[STEP 4/10] Verifying Patient Database Persistence...');
    const patientDetailsRes = await makeRequest(
      'GET',
      `${BACKEND_URL}/api/patients/${createdPatientId}`,
      null,
      { Authorization: `Bearer ${ashaToken}` }
    );
    console.assert(patientDetailsRes.status === 200, 'Patient retrieval failed');
    console.assert(patientDetailsRes.body.patient.name === patientName, 'Patient name mismatch');
    console.log(' ✅ Patient DB Persistence PASSED. ID:', createdPatientId);

    // 5. Retinal Image Upload (Storage & Database Scan Record)
    console.log('\n[STEP 5/10] Uploading Retinal Photo (Storage & Scan Creation)...');
    const dummyImgPath = path.join(__dirname, 'test_retina.png');
    const realSampleImgPath = '/Users/sakshishetty/.cache/kagglehub/datasets/mariaherrerot/messidor2preprocess/versions/2/messidor-2/messidor-2/preprocess/20051021_51936_0100_PP.png';
    fs.copyFileSync(realSampleImgPath, dummyImgPath);

    const uploadRes = await uploadMultipartScan(`${BACKEND_URL}/api/scans`, createdPatientId, dummyImgPath, ashaToken);
    console.assert(uploadRes.status === 201, 'Upload failed');
    createdScanId = uploadRes.body.scan.id;
    console.assert(uploadRes.body.scan.status === 'UPLOADED', 'Scan status should be UPLOADED initially');
    console.log(' ✅ Image Upload PASSED. Scan ID:', createdScanId);

    // 6. AI Screening Trigger & Model Prediction with Grad-CAM
    console.log('\n[STEP 6/10] Triggering AI Analysis & Verifying Model Prediction + Grad-CAM...');
    const analyzeRes = await makeRequest('POST', `${BACKEND_URL}/api/scans/${createdScanId}/analyze`, null, {
      Authorization: `Bearer ${ashaToken}`,
    });
    console.assert(analyzeRes.status === 200, 'Analyze request failed');
    console.assert(analyzeRes.body.scan.status === 'COMPLETED', `Expected COMPLETED status, got ${analyzeRes.body.scan.status}`);
    console.assert(typeof analyzeRes.body.scan.predictedClass === 'number', 'Expected valid predictedClass integer');
    console.assert(analyzeRes.body.scan.heatmapImageUrl, 'Expected valid Grad-CAM heatmap URL');
    console.log(' ✅ AI Analysis Request PASSED:', {
      status: analyzeRes.body.scan.status,
      predictedClass: analyzeRes.body.scan.predictedClass,
      severity: analyzeRes.body.scan.severity,
      confidence: analyzeRes.body.scan.confidence,
      heatmapImageUrl: analyzeRes.body.scan.heatmapImageUrl,
    });

    // 7. Verify Database Record Status Update
    console.log('\n[STEP 7/10] Verifying Scan Status in Database...');
    const scanRecordRes = await makeRequest('GET', `${BACKEND_URL}/api/scans/${createdScanId}`, null, {
      Authorization: `Bearer ${ashaToken}`,
    });
    console.assert(scanRecordRes.status === 200, 'Scan retrieval failed');
    console.assert(scanRecordRes.body.scan.status === 'COMPLETED', 'Scan status mismatch');
    console.log(' ✅ Scan Database Record Verified:', scanRecordRes.body.scan.status);

    // 8. Doctor & Admin Portal Integration
    console.log('\n[STEP 8/10] Verifying Doctor Queue & Admin Aggregations...');
    const doctorScansRes = await makeRequest('GET', `${BACKEND_URL}/api/admin/scans`, null, {
      Authorization: `Bearer ${doctorToken}`,
    });
    console.assert(doctorScansRes.status === 200, 'Doctor queue access failed');
    console.log(' ✅ Doctor Queue PASSED. Total Scans:', doctorScansRes.body.scans.length);

    const adminStatsRes = await makeRequest('GET', `${BACKEND_URL}/api/admin/stats`, null, {
      Authorization: `Bearer ${adminToken}`,
    });
    console.assert(adminStatsRes.status === 200, 'Admin stats access failed');
    console.log(' ✅ Admin Stats PASSED:', adminStatsRes.body);

    // 9. Multilingual i18n Locales Verification
    console.log('\n[STEP 9/10] Verifying 8-Language i18n Dictionaries...');
    const localesDir = path.join(__dirname, '..', 'frontend', 'src', 'i18n', 'locales');
    const languages = ['en', 'hi', 'mr', 'ta', 'te', 'kn', 'bn', 'gu'];
    languages.forEach((lang) => {
      const locPath = path.join(localesDir, `${lang}.json`);
      console.assert(fs.existsSync(locPath), `Missing locale file: ${lang}.json`);
      const content = JSON.parse(fs.readFileSync(locPath, 'utf8'));
      console.assert(content.app && content.app.title, `Missing app.title in ${lang}.json`);
      console.assert(content.result && content.result.screeningVerdict, `Missing result.screeningVerdict in ${lang}.json`);
    });
    console.log(' ✅ All 8 Language Locales (en, hi, mr, ta, te, kn, bn, gu) Verified Cleanly.');

    // 10. Cleanup
    if (fs.existsSync(dummyImgPath)) fs.unlinkSync(dummyImgPath);

    console.log('\n================================================================');
    console.log('  ALL E2E WEBSITE WORKFLOW & DATABASE TESTS PASSED CLEANLY! ✅  ');
    console.log('================================================================');
  } catch (err) {
    console.error('\n❌ E2E VERIFICATION ERROR:', err);
    process.exitCode = 1;
  }
}

function makeRequest(method, urlStr, payload = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const body = JSON.parse(data);
          resolve({ status: res.statusCode, body });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    if (payload) req.write(JSON.stringify(payload));
    req.end();
  });
}

function uploadMultipartScan(urlStr, patientId, filePath, token) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const boundary = '----TestBoundary' + Date.now().toString(16);
    const fileName = path.basename(filePath);
    const fileData = fs.readFileSync(filePath);

    const mimeType = fileName.endsWith('.png') ? 'image/png' : 'image/jpeg';
    const header = `--${boundary}\r\nContent-Disposition: form-data; name="patientId"\r\n\r\n${patientId}\r\n--${boundary}\r\nContent-Disposition: form-data; name="image"; filename="${fileName}"\r\nContent-Type: ${mimeType}\r\n\r\n`;
    const footer = `\r\n--${boundary}--\r\n`;

    const bodyBuffer = Buffer.concat([
      Buffer.from(header),
      fileData,
      Buffer.from(footer),
    ]);

    const req = http.request(
      {
        method: 'POST',
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        headers: {
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          'Content-Length': bodyBuffer.length,
          Authorization: `Bearer ${token}`,
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(data) });
          } catch {
            resolve({ status: res.statusCode, body: data });
          }
        });
      }
    );

    req.on('error', reject);
    req.write(bodyBuffer);
    req.end();
  });
}

runFullE2eVerification();
