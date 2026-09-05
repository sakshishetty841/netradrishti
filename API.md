# NetraDrishti API Specification

Explainable AI for Diabetic Retinopathy Screening in Rural India (SIH26038)

---

## Health Check

### `GET /api/health`
Checks backend API, AI service, and model readiness status.

- **Authentication**: None
- **Response (200 OK)**:
  ```json
  {
    "backend": "OK",
    "aiService": "OK",
    "model": "READY",
    "timestamp": "2026-09-05T07:50:43.762Z"
  }
  ```
- **Response when model is missing (200 OK)**:
  ```json
  {
    "backend": "OK",
    "aiService": "OFFLINE",
    "model": "NOT_READY",
    "timestamp": "2026-09-05T07:50:43.762Z"
  }
  ```

---

## Authentication

### `POST /api/auth/login`
Authenticates a health worker, doctor, or administrator and issues a JWT token.

- **Authentication**: None
- **Request Body**:
  ```json
  {
    "email": "asha@phc.in",
    "password": "password123"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "message": "Login successful",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "271434b3-dc42-44f2-9584-508ddc61c588",
      "name": "Anjali Sharma (ASHA Worker)",
      "email": "asha@phc.in",
      "role": "ASHA",
      "createdAt": "2026-09-05T07:45:00.000Z"
    }
  }
  ```
- **Errors**:
  - `400 Bad Request`: Email and password required.
  - `401 Unauthorized`: Invalid email or password.

### `GET /api/auth/me`
Retrieves currently authenticated user profile.

- **Authentication**: Bearer JWT
- **Response (200 OK)**:
  ```json
  {
    "user": {
      "id": "271434b3-dc42-44f2-9584-508ddc61c588",
      "name": "Anjali Sharma (ASHA Worker)",
      "email": "asha@phc.in",
      "role": "ASHA"
    }
  }
  ```

---

## Patient Management

### `POST /api/patients`
Registers a new diabetic patient record.

- **Authentication**: Bearer JWT
- **Allowed Roles**: `ASHA`, `ADMIN`
- **Request Body**:
  ```json
  {
    "name": "Sunita Patil",
    "age": 52,
    "gender": "Female",
    "region": "Satara Rural PHC-1"
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "message": "Patient registered successfully",
    "patient": {
      "id": "8f3b2a-...",
      "patientCode": "PAT-00001",
      "name": "Sunita Patil",
      "age": 52,
      "gender": "Female",
      "region": "Satara Rural PHC-1",
      "createdBy": "271434b3-...",
      "createdAt": "2026-09-05T07:46:00.000Z"
    }
  }
  ```

### `GET /api/patients`
Lists registered patients with optional search filter.

- **Authentication**: Bearer JWT
- **Query Parameters**: `search` (optional)
- **Response (200 OK)**:
  ```json
  {
    "patients": [
      {
        "id": "8f3b2a-...",
        "patientCode": "PAT-00001",
        "name": "Sunita Patil",
        "age": 52,
        "gender": "Female",
        "region": "Satara Rural PHC-1",
        "scans": []
      }
    ],
    "count": 1
  }
  ```

### `GET /api/patients/:id`
Retrieves patient details along with complete scan history.

- **Authentication**: Bearer JWT
- **Response (200 OK)**:
  ```json
  {
    "patient": {
      "id": "8f3b2a-...",
      "patientCode": "PAT-00001",
      "name": "Sunita Patil",
      "scans": [...]
    }
  }
  ```

---

## Retinal Image Scans & AI Analysis

### `POST /api/scans`
Uploads a retinal fundus photo. Sets scan status to `UPLOADED`.

- **Authentication**: Bearer JWT
- **Allowed Roles**: `ASHA`, `ADMIN`
- **Content-Type**: `multipart/form-data`
- **Fields**:
  - `patientId`: String (required)
  - `image`: File (.jpg, .jpeg, .png, max 10MB)
- **Response (201 Created)**:
  ```json
  {
    "message": "Retinal image uploaded successfully. Scan status set to UPLOADED.",
    "scan": {
      "id": "f3907e69-...",
      "patientId": "8f3b2a-...",
      "originalImageUrl": "/uploads/originals/retina-1725522600.jpg",
      "status": "UPLOADED",
      "createdAt": "2026-09-05T07:47:00.000Z"
    }
  }
  ```

### `POST /api/scans/:id/analyze`
Triggers AI screening inference on an uploaded retinal image.

- **Authentication**: Bearer JWT
- **Response when AI Model is Ready (200 OK)**:
  ```json
  {
    "message": "AI screening analysis completed successfully.",
    "scan": {
      "id": "f3907e69-...",
      "status": "COMPLETED",
      "predictedClass": 2,
      "severity": "MODERATE",
      "confidence": 0.9145,
      "originalImageUrl": "/uploads/originals/retina-1725522600.jpg",
      "heatmapImageUrl": "/ai-outputs/heatmaps/heatmap-a1b2c3.jpg",
      "explanationText": "The AI model (EfficientNet-B0) identified visual patterns in the retinal image that contributed to the Moderate DR prediction with 91.5% confidence...",
      "recommendationText": "Ophthalmologist review recommended within 4 to 6 weeks for detailed fundus examination.",
      "modelVersion": "DR-EfficientNet-B0-v1",
      "analyzedAt": "2026-09-05T07:47:15.000Z"
    }
  }
  ```
- **Response when AI Model is NOT Ready (200 OK)**:
  ```json
  {
    "message": "AI Model is not ready.",
    "scan": {
      "id": "f3907e69-...",
      "status": "MODEL_NOT_READY",
      "explanationText": "The diabetic retinopathy model has not been trained or loaded yet."
    }
  }
  ```

### `GET /api/scans/:id`
Retrieves detailed scan record.

- **Authentication**: Bearer JWT
- **Response (200 OK)**: Full scan object with patient and uploadedBy metadata.

---

## Admin Analytics

### `GET /api/admin/stats`
Retrieves real aggregate statistics calculated directly from database records.

- **Authentication**: Bearer JWT
- **Allowed Roles**: `ADMIN`, `PHC_DOCTOR`
- **Response (200 OK)**:
  ```json
  {
    "totalPatients": 12,
    "totalScans": 15,
    "completedScans": 10,
    "pendingScans": 2,
    "modelNotReadyScans": 3,
    "referredScans": 4,
    "severityDistribution": {
      "NO_DR": 4,
      "MILD": 2,
      "MODERATE": 2,
      "SEVERE": 1,
      "PROLIFERATIVE": 1
    },
    "regionDistribution": [
      { "region": "Satara Rural PHC-1", "patientCount": 8 },
      { "region": "Wardha PHC-4", "patientCount": 4 }
    ]
  }
  ```
