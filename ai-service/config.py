import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent

MODEL_DIR = BASE_DIR / "model"
MODEL_PATH = os.getenv("MODEL_PATH", str(MODEL_DIR / "diabetic_retinopathy.pth"))

OUTPUT_DIR = BASE_DIR / "outputs" / "heatmaps"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

MODEL_VERSION = "DR-EfficientNet-B0-v1"
NUM_CLASSES = 5

SEVERITY_CLASSES = {
    0: "NO_DR",
    1: "MILD",
    2: "MODERATE",
    3: "SEVERE",
    4: "PROLIFERATIVE"
}

SEVERITY_DESCRIPTIONS = {
    0: "No Diabetic Retinopathy detected.",
    1: "Mild Diabetic Retinopathy detected.",
    2: "Moderate Diabetic Retinopathy detected.",
    3: "Severe Diabetic Retinopathy detected.",
    4: "Proliferative Diabetic Retinopathy detected."
}
