const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const { URL } = require('url');

/**
 * Sends a local retinal image file to the Python FastAPI AI service.
 * @param {string} imageAbsolutePath Absolute path to the original retinal image file.
 * @returns {Promise<Object>} Response object from AI service.
 */
async function predictRetinalScan(imageAbsolutePath) {
  const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';
  const targetUrl = new URL('/predict', aiServiceUrl);

  if (!fs.existsSync(imageAbsolutePath)) {
    throw new Error(`Image file not found at path: ${imageAbsolutePath}`);
  }

  const fileStream = fs.createReadStream(imageAbsolutePath);
  const fileName = path.basename(imageAbsolutePath);
  const boundary = '----RetinaScanBoundary' + Date.now().toString(16);

  const header = `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${fileName}"\r\nContent-Type: image/jpeg\r\n\r\n`;
  const footer = `\r\n--${boundary}--\r\n`;

  const stat = fs.statSync(imageAbsolutePath);
  const contentLength = Buffer.byteLength(header) + stat.size + Buffer.byteLength(footer);

  return new Promise((resolve, reject) => {
    const protocol = targetUrl.protocol === 'https:' ? https : http;

    const req = protocol.request(
      targetUrl,
      {
        method: 'POST',
        headers: {
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          'Content-Length': contentLength,
        },
        timeout: 30000, // 30s timeout
      },
      (res) => {
        let rawData = '';
        res.on('data', (chunk) => {
          rawData += chunk;
        });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(rawData);
            resolve(parsed);
          } catch (e) {
            reject(new Error(`Invalid JSON response from AI service: ${rawData}`));
          }
        });
      }
    );

    req.on('error', (err) => {
      console.warn(`[AI SERVICE CONNECT ERROR] Unable to connect to ${targetUrl.href}: ${err.message}`);
      resolve({
        status: 'MODEL_NOT_READY',
        message: 'The AI inference service is currently offline or unavailable. Please ensure python FastAPI service is running.',
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        status: 'FAILED',
        message: 'AI inference service request timed out.',
      });
    });

    req.write(Buffer.from(header));
    fileStream.pipe(req, { end: false });
    fileStream.on('end', () => {
      req.write(Buffer.from(footer));
      req.end();
    });
  });
}

/**
 * Checks health of Python AI Service.
 */
async function checkAiServiceHealth() {
  const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';
  const targetUrl = new URL('/health', aiServiceUrl);

  return new Promise((resolve) => {
    const protocol = targetUrl.protocol === 'https:' ? https : http;

    const req = protocol.get(targetUrl, { timeout: 3000 }, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed);
        } catch {
          resolve({ status: 'UNREACHABLE', model: 'NOT_READY' });
        }
      });
    });

    req.on('error', () => {
      resolve({ status: 'UNREACHABLE', model: 'NOT_READY' });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ status: 'TIMEOUT', model: 'NOT_READY' });
    });
  });
}

module.exports = {
  predictRetinalScan,
  checkAiServiceHealth,
};
