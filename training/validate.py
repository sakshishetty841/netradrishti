import os
import sys
import torch
import pandas as pd
import numpy as np

from config import UNIFIED_METADATA_CSV, NUM_CLASSES, BEST_MODEL_PATH
from dataset import RetinalDataset
from metrics import calculate_metrics

sys.path.append(os.path.join(os.path.dirname(__file__), "..", "ai-service"))
from inference import DRClassifier

def validate_checkpoint():
    if not os.path.exists(BEST_MODEL_PATH):
        print(f"[VALIDATION] Model file not found at '{BEST_MODEL_PATH}'.")
        return

    print(f"[VALIDATION] Verifying model state dict at '{BEST_MODEL_PATH}'...")
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model = DRClassifier(num_classes=NUM_CLASSES)

    try:
        checkpoint = torch.load(BEST_MODEL_PATH, map_location=device)
        state_dict = checkpoint.get("state_dict", checkpoint)
        model.load_state_dict(state_dict)
        print("[VALIDATION] Model state dict verified successfully.")
    except Exception as e:
        print(f"[VALIDATION ERROR] State dict verification failed: {e}")

if __name__ == "__main__":
    validate_checkpoint()
