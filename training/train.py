import os
import sys
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, Subset
from sklearn.model_selection import StratifiedKFold
import pandas as pd
import numpy as np
from torchvision import models

from config import (
    UNIFIED_METADATA_CSV, BATCH_SIZE, NUM_EPOCHS, LEARNING_RATE,
    WEIGHT_DECAY, NUM_CLASSES, CHECKPOINTS_DIR, BEST_MODEL_PATH
)
from dataset import RetinalDataset
from metrics import calculate_metrics

class DRClassifier(nn.Module):
    def __init__(self, num_classes=5, pretrained=True):
        super(DRClassifier, self).__init__()
        weights = models.EfficientNet_B0_Weights.DEFAULT if pretrained else None
        self.backbone = models.efficientnet_b0(weights=weights)
        in_features = self.backbone.classifier[1].in_features
        self.backbone.classifier[1] = nn.Linear(in_features, num_classes)

    def forward(self, x):
        return self.backbone(x)

def train_model():
    if not os.path.exists(UNIFIED_METADATA_CSV):
        print(f"============================================================")
        print(f"[TRAINING PIPELINE] STATUS: DATASET NOT PROVIDED YET")
        print(f"Unified metadata file '{UNIFIED_METADATA_CSV}' was not found.")
        print(f"Place retinal datasets (EyePACS, DDR, APTOS, IDRiD, Messidor-2)")
        print(f"in the 'datasets/' directory and run 'python training/convert_dataset.py'.")
        print(f"============================================================")
        return

    print(f"[TRAINING] Loading unified metadata from '{UNIFIED_METADATA_CSV}'...")
    df = pd.read_csv(UNIFIED_METADATA_CSV)

    if len(df) == 0:
        print("[TRAINING] Dataset CSV is empty.")
        return

    labels = df["label"].values
    class_counts = np.bincount(labels, minlength=NUM_CLASSES)
    print(f"[TRAINING] Dataset size: {len(df)} images. Class counts: {class_counts.tolist()}")

    # Compute Class Weights for Weighted Cross Entropy Loss
    total_samples = len(labels)
    class_weights = total_samples / (NUM_CLASSES * class_counts.astype(np.float32) + 1e-5)
    class_weights_tensor = torch.tensor(class_weights, dtype=torch.float32)

    # Train/Validation Stratified Split
    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    train_idx, val_idx = next(skf.split(df, labels))

    print("[TRAINING] Pre-loading dataset into RAM cache for high-speed training...", flush=True)
    full_dataset_train = RetinalDataset(UNIFIED_METADATA_CSV, is_train=True, preload=True)
    full_dataset_val = RetinalDataset(UNIFIED_METADATA_CSV, is_train=False, preload=True)

    train_dataset = Subset(full_dataset_train, train_idx)
    val_dataset = Subset(full_dataset_val, val_idx)

    train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True, num_workers=0, pin_memory=False)
    val_loader = DataLoader(val_dataset, batch_size=BATCH_SIZE, shuffle=False, num_workers=0, pin_memory=False)

    if torch.cuda.is_available():
        device = torch.device("cuda")
    elif hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
        device = torch.device("mps")
    else:
        device = torch.device("cpu")

    print(f"[TRAINING] Initializing EfficientNet-B0 model on device: {device}...")

    model = DRClassifier(num_classes=NUM_CLASSES, pretrained=True).to(device)
    print(f"[TRAINING] Model initialized. Starting training loop for {NUM_EPOCHS} epochs...", flush=True)
    criterion = nn.CrossEntropyLoss(weight=class_weights_tensor.to(device))
    optimizer = optim.AdamW(model.parameters(), lr=LEARNING_RATE, weight_decay=WEIGHT_DECAY)
    scheduler = optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=NUM_EPOCHS)

    best_val_loss = float("inf")
    best_qwk = -1.0

    for epoch in range(1, NUM_EPOCHS + 1):
        model.train()
        train_loss = 0.0

        for batch_idx, (images, targets) in enumerate(train_loader, 1):
            if batch_idx == 1:
                print(f" -> Starting Epoch [{epoch}/{NUM_EPOCHS}] first batch...", flush=True)
            images, targets = images.to(device), targets.to(device)
            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, targets)
            loss.backward()
            optimizer.step()
            train_loss += loss.item() * images.size(0)
            if batch_idx % 10 == 0 or batch_idx == len(train_loader):
                print(f" -> Epoch [{epoch}/{NUM_EPOCHS}] Batch [{batch_idx}/{len(train_loader)}] Batch Loss: {loss.item():.4f}", flush=True)

        train_loss /= len(train_idx)

        # Validation phase
        model.eval()
        val_loss = 0.0
        all_targets = []
        all_preds = []

        with torch.no_grad():
            for images, targets in val_loader:
                images, targets = images.to(device), targets.to(device)
                outputs = model(images)
                loss = criterion(outputs, targets)
                val_loss += loss.item() * images.size(0)

                preds = torch.argmax(outputs, dim=1)
                all_targets.extend(targets.cpu().numpy())
                all_preds.extend(preds.cpu().numpy())

        val_loss /= len(val_idx)
        scheduler.step()

        metrics = calculate_metrics(np.array(all_targets), np.array(all_preds), num_classes=NUM_CLASSES)

        print(
            f"Epoch [{epoch}/{NUM_EPOCHS}] "
            f"Train Loss: {train_loss:.4f} | Val Loss: {val_loss:.4f} | "
            f"Val Acc: {metrics['accuracy']:.4f} | QWK: {metrics.get('qwk', 0.0):.4f} | "
            f"Val Sens: {metrics['macro_sensitivity']:.4f} | Val Spec: {metrics['macro_specificity']:.4f} | "
            f"Val F1: {metrics['macro_f1']:.4f}",
            flush=True
        )

        # Save Best Checkpoint based on lowest Val Loss / highest QWK
        if val_loss < best_val_loss or metrics.get('qwk', 0.0) > best_qwk:
            if val_loss < best_val_loss:
                best_val_loss = val_loss
            if metrics.get('qwk', 0.0) > best_qwk:
                best_qwk = metrics.get('qwk', 0.0)

            checkpoint_path = os.path.join(CHECKPOINTS_DIR, "best_model.pth")
            torch.save({"state_dict": model.state_dict(), "metrics": metrics}, checkpoint_path)
            
            # Export to AI service model path and root model path
            alt_path = BEST_MODEL_PATH.parent.parent / "model" / "diabetic_retinopathy.pth"
            for p in [BEST_MODEL_PATH, alt_path]:
                os.makedirs(os.path.dirname(p), exist_ok=True)
                torch.save({"state_dict": model.state_dict(), "metrics": metrics}, p)
            print(f" -> Saved new best model checkpoint to '{BEST_MODEL_PATH}'", flush=True)

    print("[TRAINING] Complete.", flush=True)

if __name__ == "__main__":
    train_model()
