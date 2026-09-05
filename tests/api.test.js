const http = require('http');
const fs = require('fs');
const path = require('path');
const app = require('../src/app');
const prisma = require('../src/config/prisma');

async function runTests() {
  console.log('====================================================');
  console.log('  STARTING AUTOMATED API VERIFICATION TESTS');
  console.log('====================================================');

  const server = app.listen(5002);
  const baseUrl = 'http://127.0.0.1:5002';

  let ashaToken = '';
  let adminToken = '';
  let createdPatientId = '';
  let createdScanId = '';

  try {
    // 1. Health Check
    console.log('[TEST 1/8] GET /api/health...');
    const healthRes = await makeRequest('GET', `${baseUrl}/api/health`);
    console.assert(healthRes.status === 200, 'Health check failed status');
    console.assert(healthRes.body.backend === 'OK', 'Backend status should be OK');
    console.log(' -> Health check PASSED:', healthRes.body);

    // 2. ASHA Login
    console.log('\n[TEST 2/8] POST /api/auth/login (ASHA)...');
    const loginRes = await makeRequest('POST', `${baseUrl}/api/auth/login`, {
      email: 'asha@phc.in',
      password: 'password123',
    });
    console.assert(loginRes.status === 200, 'ASHA login failed');
    ashaToken = loginRes.body.token;
    console.assert(ashaToken && ashaToken.length > 10, 'JWT token missing');
    console.log(' -> ASHA Login PASSED. Token acquired.');

    // 3. Admin Login
    console.log('\n[TEST 3/8] POST /api/auth/login (ADMIN)...');
    const adminLoginRes = await makeRequest('POST', `${baseUrl}/api/auth/login`, {
      email: 'admin@phc.in',
      password: 'password123',
    });
    console.assert(adminLoginRes.status === 200, 'Admin login failed');
    adminToken = adminLoginRes.body.token;
    console.log(' -> Admin Login PASSED.');

    // 4. Authenticated /me check
    console.log('\n[TEST 4/8] GET /api/auth/me...');
    const meRes = await makeRequest('GET', `${baseUrl}/api/auth/me`, null, {
      Authorization: `Bearer ${ashaToken}`,
    });
    console.assert(meRes.status === 200, '/me check failed');
    console.assert(meRes.body.user.role === 'ASHA', 'User role should be ASHA');
    console.log(' -> Auth /me PASSED:', meRes.body.user.email);

    // 5. Patient Creation
    console.log('\n[TEST 5/8] POST /api/patients...');
    const patientRes = await makeRequest(
      'POST',
      `${baseUrl}/api/patients`,
      {
        name: 'Test Patient Verification',
        age: 58,
        gender: 'Female',
        region: 'Test Wardha PHC',
      },
      { Authorization: `Bearer ${ashaToken}` }
    );
    console.assert(patientRes.status === 201, 'Patient creation failed');
    createdPatientId = patientRes.body.patient.id;
    console.log(' -> Patient Creation PASSED. Code:', patientRes.body.patient.patientCode);

    // 6. Patient Search / Listing
    console.log('\n[TEST 6/8] GET /api/patients?search=Test...');
    const searchRes = await makeRequest('GET', `${baseUrl}/api/patients?search=Test`, null, {
      Authorization: `Bearer ${ashaToken}`,
    });
    console.assert(searchRes.status === 200, 'Patient search failed');
    console.assert(searchRes.body.patients.length > 0, 'Should return at least 1 patient');
    console.log(' -> Patient Search PASSED. Found:', searchRes.body.patients.length);

    // 7. Admin Stats Aggregations
    console.log('\n[TEST 7/8] GET /api/admin/stats...');
    const statsRes = await makeRequest('GET', `${baseUrl}/api/admin/stats`, null, {
      Authorization: `Bearer ${adminToken}`,
    });
    console.assert(statsRes.status === 200, 'Admin stats failed');
    console.assert(typeof statsRes.body.totalPatients === 'number', 'totalPatients should be a number');
    console.log(' -> Admin Stats PASSED:', statsRes.body);

    // 8. Image Upload Simulation & Analysis check
    console.log('\n[TEST 8/8] Retinal Image Upload & AI Scan Analysis Request...');
    // Create a dummy JPEG image for testing upload
    const dummyImagePath = path.join(__dirname, 'dummy_retina.jpg');
    // Simple 1x1 JPEG header + pixel
    const dummyJpegBuffer = Buffer.from([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
      0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43,
      0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
      0x09, 0x08, 0x0a, 0x0c, 0x14, 0x0d, 0x0c, 0x0b, 0x0b, 0x0c, 0x19, 0x12,
      0x13, 0x0f, 0x14, 0x1d, 0x1a, 0x1f, 0x1e, 0x1d, 0x1a, 0x1c, 0x1c, 0x20,
      0x24, 0x2e, 0x27, 0x20, 0x22, 0x2c, 0x23, 0x1c, 0x1c, 0x28, 0x37, 0x29,
      0x2c, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1f, 0x27, 0x39, 0x3d, 0x38, 0x32,
      0x3c, 0x2e, 0x33, 0x34, 0x32, 0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x10,
      0x00, 0x10, 0x01, 0x01, 0x11, 0x00, 0xff, 0xc4, 0x00, 0x1f, 0x00, 0x00,
      0x01, 0x05, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08,
      0x09, 0x0a, 0x0b, 0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f,
      0x00, 0x37, 0xff, 0xd9
    ]);
    fs.writeFileSync(dummyImagePath, dummyJpegBuffer);

    // Upload scan using multipart/form-data
    const uploadRes = await uploadMultipartScan(`${baseUrl}/api/scans`, createdPatientId, dummyImagePath, ashaToken);
    console.assert(uploadRes.status === 201, 'Scan upload failed');
    createdScanId = uploadRes.body.scan.id;
    console.assert(uploadRes.body.scan.status === 'UPLOADED', 'Scan status should be UPLOADED initially');
    console.log(' -> Retinal Image Upload PASSED. Scan ID:', createdScanId);

    // Trigger AI analysis
    const analyzeRes = await makeRequest('POST', `${baseUrl}/api/scans/${createdScanId}/analyze`, null, {
      Authorization: `Bearer ${ashaToken}`,
    });
    console.assert(analyzeRes.status === 200, 'Scan analyze request failed');
    console.log(' -> Scan Analysis Request PASSED. Status:', analyzeRes.body.scan.status);

    // Cleanup dummy image file
    if (fs.existsSync(dummyImagePath)) fs.unlinkSync(dummyImagePath);

    console.log('\n====================================================');
    console.log('  ALL AUTOMATED API TESTS PASSED SUCCESSFULLY! ✅');
    console.log('====================================================');
  } catch (err) {
    console.error('\n❌ TEST FAILED:', err);
    process.exitCode = 1;
  } finally {
    server.close();
    await prisma.$disconnect();
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

    const header = `--${boundary}\r\nContent-Disposition: form-data; name="patientId"\r\n\r\n${patientId}\r\n--${boundary}\r\nContent-Disposition: form-data; name="image"; filename="${fileName}"\r\nContent-Type: image/jpeg\r\n\r\n`;
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

runTests();
