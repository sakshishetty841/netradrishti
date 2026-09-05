# NetraDrishti — Explainable AI for Diabetic Retinopathy Screening in Rural India

**SIH Problem ID**: SIH26038

NetraDrishti is an end-to-end explainable AI screening system designed for rural Primary Health Centers (PHCs) and Accredited Social Health Activists (ASHA workers) across India.

> [!IMPORTANT]  
> **MEDICAL CLARIFICATION**:  
> 1. The system does **NOT** diagnose diabetes.  
> 2. The system is designed for individuals with known diabetes to screen retinal fundus photographs for signs of Diabetic Retinopathy (DR).  
> 3. DR Severity Classification:  
>    - **Class 0**: No Diabetic Retinopathy (`NO_DR`)  
>    - **Class 1**: Mild Diabetic Retinopathy (`MILD`)  
>    - **Class 2**: Moderate Diabetic Retinopathy (`MODERATE`)  
>    - **Class 3**: Severe Diabetic Retinopathy (`SEVERE`)  
>    - **Class 4**: Proliferative Diabetic Retinopathy (`PROLIFERATIVE`)  
> 4. NetraDrishti is a **clinical decision-support tool** and does **NOT** replace an ophthalmologist or provide definitive medical diagnosis.

---

## 1. System Architecture

```
                    REACT + VITE FRONTEND (Port 3000)
                               │
                               │ HTTP / REST
                               ▼
                     NODE.JS / EXPRESS API (Port 5001)
                               │
             ┌─────────────────┼─────────────────┐
             ▼                 ▼                 ▼
       SQLite / Postgres    Uploads         JWT Auth & RBAC
        + Prisma Client  (originals, heatmaps)
                               │
                               ▼
                     PYTHON FASTAPI SERVICE (Port 8000)
                               │
                               ▼
                     DR EFFICIENTNET-B0 MODEL
                               │
                   ┌───────────┴───────────┐
                   ▼                       ▼
             DR Prediction             Grad-CAM
            (Severity 0-4)             Heatmap
                   └───────────┬───────────┘
                               ▼
                         Node Backend
                               ▼
                        Frontend Display
```

---

## 2. Technology Stack

- **Backend**: Node.js, Express, Prisma ORM, SQLite/PostgreSQL, JWT Auth, bcryptjs, Multer
- **AI Inference Service**: Python 3.10+, FastAPI, PyTorch, torchvision (EfficientNet-B0), OpenCV, Grad-CAM, PIL, NumPy
- **Training Pipeline**: PyTorch, Weighted Cross-Entropy Loss, Stratified Split, Medical Augmentations, Perceptual SHA-256 Deduplication, Metrics calculation (Sensitivity, Specificity, F1, Balanced Accuracy)
- **Frontend**: React 18, Vite, Lucide Icons, Tailwind CSS / Modern Glassmorphic Healthcare UI

---

## 3. Operational Integrity & Real Data Rule

1. **No Fake Predictions**: If the PyTorch model file (`ai-service/model/diabetic_retinopathy.pth`) is absent, the system responds with `MODEL_NOT_READY` and displays a clear notification. It never generates fake/hardcoded predictions or heatmaps.
2. **Dynamic Admin Statistics**: All admin statistics and DR severity distributions are computed dynamically using database queries.

---

## 4. Setup and Installation

### Prerequisites
- Node.js v18+ and npm
- Python 3.10+
- (Optional) Docker and Docker Compose

---

### Step A: Backend Setup

1. Install Node dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables (`.env`):
   ```env
   PORT=5001
   NODE_ENV=development
   DATABASE_URL="file:./dev.db"
   JWT_SECRET="sih26038-diabetic-retinopathy-screening-secret-key-2026"
   AI_SERVICE_URL="http://127.0.0.1:8000"
   UPLOAD_DIR="./uploads"
   MAX_FILE_SIZE=10485760
   ```

3. Initialize Prisma Database & Seed Initial Users:
   ```bash
   npx prisma db push
   npm run db:seed
   ```
   Default demo accounts created:
   - **ASHA Worker**: `asha@phc.in` (password: `password123`)
   - **PHC Doctor**: `doctor@phc.in` (password: `password123`)
   - **Admin**: `admin@phc.in` (password: `password123`)

4. Start Express Backend:
   ```bash
   npm start
   ```
   Backend runs at: `http://localhost:5001`

---

### Step B: Python AI Service Setup

1. Navigate to `ai-service/`:
   ```bash
   cd ai-service
   ```

2. Create virtual environment and install dependencies:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. Run FastAPI AI Service:
   ```bash
   python app.py
   # Or using uvicorn: uvicorn app:app --host 0.0.0.0 --port 8000 --reload
   ```
   FastAPI Service runs at: `http://127.0.0.1:8000`

---

### Step C: Machine Learning Training Pipeline

To train the EfficientNet-B0 model when raw datasets arrive:

1. Place dataset files under `datasets/`:
   ```text
   datasets/
   ├── eyepacs/
   ├── ddr/
   ├── aptos/
   ├── idrid/
   └── messidor2/   (Reserved strictly for external testing)
   ```

2. Convert dataset annotations to unified metadata:
   ```bash
   python training/convert_dataset.py
   ```

3. Deduplicate dataset:
   ```bash
   python training/deduplicate.py
   ```

4. Train PyTorch EfficientNet-B0 model:
   ```bash
   python training/train.py
   ```
   The best checkpoint will be automatically saved to `ai-service/model/diabetic_retinopathy.pth`.

5. Evaluate trained model on external test set (Messidor-2):
   ```bash
   python training/evaluate.py
   ```

---

### Step D: Frontend Setup

1. Navigate to `frontend/`:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start Vite dev server:
   ```bash
   npm run dev
   ```
   Frontend runs at: `http://localhost:3000`

---

## 5. Automated Verification Tests

Run backend automated verification tests:
```bash
npm test
```
Runs 8 end-to-end tests verifying health check, JWT authentication, role protection, patient creation, image upload, `MODEL_NOT_READY` state handling, and admin statistics.

---

## 6. Docker Deployment

Deploy full stack via Docker Compose:
```bash
docker-compose up --build
```

---

## 7. User Roles Summary

- **ASHA Worker**: Patient registration, retinal photo upload, starting screening, viewing scan history.
- **PHC Doctor**: Specialist review queue, referral urgency list, Grad-CAM heatmap inspection.
- **Admin**: System-wide statistics, DR severity distribution, regional metrics, audit logs.


### Priya Kumari
