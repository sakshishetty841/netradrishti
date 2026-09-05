import os
import sys
import torch
import torch.nn as nn
import pandas as pd
import numpy as np
from torch.utils.data import DataLoader
from torchvision import models

from config import EXTERNAL_TEST_CSV, NUM_CLASSES, BEST_MODEL_PATH
from dataset import RetinalDataset
from metrics import calculate_metrics

class DRClassifier(nn.Module):
    def __init__(self, num_classes=5, pretrained=False):
        super(DRClassifier, self).__init__()
        weights = models.EfficientNet_B0_Weights.DEFAULT if pretrained else None
        self.backbone = models.efficientnet_b0(weights=weights)
        in_features = self.backbone.classifier[1].in_features
        self.backbone.classifier[1] = nn.Linear(in_features, num_classes)

    def forward(self, x):
        return self.backbone(x)

def evaluate_external_test():
    if not os.path.exists(EXTERNAL_TEST_CSV):
        print(f"[EVALUATION] External test CSV '{EXTERNAL_TEST_CSV}' not found.")
        return

    if not os.path.exists(BEST_MODEL_PATH):
        print(f"[EVALUATION] Trained model weights not found at '{BEST_MODEL_PATH}'. Train model first.")
        return

    df = pd.read_csv(EXTERNAL_TEST_CSV)
    print(f"[EVALUATION] Evaluating model on Messidor-2 external test set ({len(df)} samples)...")

    dataset = RetinalDataset(EXTERNAL_TEST_CSV, is_train=False)
    loader = DataLoader(dataset, batch_size=32, shuffle=False, num_workers=0, pin_memory=False)

    if torch.cuda.is_available():
        device = torch.device("cuda")
    elif hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
        device = torch.device("mps")
    else:
        device = torch.device("cpu")

    model = DRClassifier(num_classes=NUM_CLASSES)
    checkpoint = torch.load(BEST_MODEL_PATH, map_location=device, weights_only=False)
    model.load_state_dict(checkpoint["state_dict"])
    model.to(device)
    model.eval()

    all_targets = []
    all_preds = []

    with torch.no_grad():
        for images, targets in loader:
            images = images.to(device)
            outputs = model(images)
            preds = torch.argmax(outputs, dim=1)
            all_targets.extend(targets.numpy())
            all_preds.extend(preds.cpu().numpy())

    metrics = calculate_metrics(np.array(all_targets), np.array(all_preds), num_classes=NUM_CLASSES)

    print("\n============================================================")
    print("      EXTERNAL TEST EVALUATION REPORT (Messidor-2)")
    print("============================================================")
    print(f"Accuracy:                  {metrics['accuracy']:.4f}")
    print(f"Balanced Accuracy:         {metrics['balanced_accuracy']:.4f}")
    print(f"Quadratic Weighted Kappa: {metrics.get('qwk', 0.0):.4f}")
    print(f"Macro Sensitivity:         {metrics['macro_sensitivity']:.4f}")
    print(f"Macro Specificity:         {metrics['macro_specificity']:.4f}")
    print(f"Macro Precision:           {metrics['macro_precision']:.4f}")
    print(f"Macro F1-Score:            {metrics['macro_f1']:.4f}")
    print("------------------------------------------------------------")
    print("Per-Class Performance:")
    for c_id, c_name in [(0, "No DR"), (1, "Mild"), (2, "Moderate"), (3, "Severe"), (4, "Proliferative")]:
        pc = metrics['per_class'][c_id]
        print(f"  Class {c_id} ({c_name}): Sens={pc['sensitivity']:.4f}, Spec={pc['specificity']:.4f}, Prec={pc['precision']:.4f}, F1={pc['f1']:.4f}")
    print("------------------------------------------------------------")
    print("Confusion Matrix:")
    for row in metrics['confusion_matrix']:
        print("  ", row)
    print("============================================================\n")

if __name__ == "__main__":
    evaluate_external_test()
