from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from config import MODEL_VERSION
from inference import is_model_available, run_inference

app = FastAPI(
    title="Diabetic Retinopathy Explainable AI Service",
    description="FastAPI service for PyTorch EfficientNet-B0 DR screening with Grad-CAM visual explanations.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    model_ready = is_model_available()
    return {
        "status": "OK",
        "service": "Diabetic Retinopathy AI Service",
        "model": "READY" if model_ready else "NOT_READY",
        "modelVersion": MODEL_VERSION
    }

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Uploaded file must be a valid image format.")

    try:
        contents = await file.read()
        result = run_inference(contents)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
