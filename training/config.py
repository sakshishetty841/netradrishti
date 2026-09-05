import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATASETS_DIR = BASE_DIR / "datasets"
CHECKPOINTS_DIR = Path(__file__).resolve().parent / "checkpoints"
CHECKPOINTS_DIR.mkdir(parents=True, exist_ok=True)

# Training Hyperparameters
BATCH_SIZE = 32
NUM_EPOCHS = 5
LEARNING_RATE = 1e-4
WEIGHT_DECAY = 1e-5
IMAGE_SIZE = 224
NUM_CLASSES = 5

MODEL_NAME = "efficientnet_b0"
BEST_MODEL_PATH = BASE_DIR / "ai-service" / "model" / "diabetic_retinopathy.pth"

# Target Dataset Paths
DATASET_PATHS = {
    "eyepacs": DATASETS_DIR / "eyepacs",
    "ddr": DATASETS_DIR / "ddr",
    "aptos": DATASETS_DIR / "aptos",
    "idrid": DATASETS_DIR / "idrid",
    "messidor2": DATASETS_DIR / "messidor2",
}

UNIFIED_METADATA_CSV = DATASETS_DIR / "unified_retina_metadata.csv"
EXTERNAL_TEST_CSV = DATASETS_DIR / "messidor2_external_test.csv"
