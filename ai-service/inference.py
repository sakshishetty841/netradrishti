import os
import sys
import torch
import torch.nn as nn
import torch.nn.functional as F
from torchvision import models

# Ensure ai-service directory is in sys.path ahead of other dirs
AI_SERVICE_DIR = os.path.dirname(os.path.abspath(__file__))
if AI_SERVICE_DIR not in sys.path:
    sys.path.insert(0, AI_SERVICE_DIR)

import config as ai_config
MODEL_PATH = getattr(ai_config, "MODEL_PATH", str(ai_config.BASE_DIR / "model" / "diabetic_retinopathy.pth"))
MODEL_VERSION = getattr(ai_config, "MODEL_VERSION", "DR-EfficientNet-B0-v1")
NUM_CLASSES = getattr(ai_config, "NUM_CLASSES", 5)
SEVERITY_CLASSES = getattr(ai_config, "SEVERITY_CLASSES", {0: "NO_DR", 1: "MILD", 2: "MODERATE", 3: "SEVERE", 4: "PROLIFERATIVE"})
SEVERITY_DESCRIPTIONS = getattr(ai_config, "SEVERITY_DESCRIPTIONS", {})

from preprocessing import check_image_quality, preprocess_retinal_image
from gradcam import generate_and_save_gradcam

class DRClassifier(nn.Module):
    def __init__(self, num_classes=5, pretrained=True):
        super(DRClassifier, self).__init__()
        weights = models.EfficientNet_B0_Weights.DEFAULT if pretrained else None
        self.backbone = models.efficientnet_b0(weights=weights)
        in_features = self.backbone.classifier[1].in_features
        self.backbone.classifier[1] = nn.Linear(in_features, num_classes)

    def forward(self, x):
        return self.backbone(x)

if torch.cuda.is_available():
    _device = torch.device("cuda")
elif hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
    _device = torch.device("mps")
else:
    _device = torch.device("cpu")

def is_model_available() -> bool:
    """Checks if trained model weights exist on disk."""
    return os.path.exists(MODEL_PATH) and os.path.getsize(MODEL_PATH) > 0

def load_model():
    """Loads the trained PyTorch EfficientNet-B0 model if available."""
    global _model
    if not is_model_available():
        print(f"[AI MODEL STATUS] Model weights file not found at '{MODEL_PATH}'. System running in MODEL_NOT_READY state.")
        _model = None
        return False

    try:
        model = DRClassifier(num_classes=NUM_CLASSES)
        checkpoint = torch.load(MODEL_PATH, map_location=_device, weights_only=False)

        if isinstance(checkpoint, dict) and "state_dict" in checkpoint:
            model.load_state_dict(checkpoint["state_dict"])
        elif isinstance(checkpoint, dict) and "model_state_dict" in checkpoint:
            model.load_state_dict(checkpoint["model_state_dict"])
        else:
            model.load_state_dict(checkpoint)

        model.to(_device)
        model.eval()
        _model = model
        print(f"[AI MODEL STATUS] Model loaded successfully from '{MODEL_PATH}' on device {_device}.")
        return True
    except Exception as e:
        print(f"[AI MODEL LOAD ERROR] Failed to load model weights: {e}")
        _model = None
        return False

# Attempt model loading at module import time
load_model()

def run_inference(image_bytes: bytes) -> dict:
    """
    Executes Diabetic Retinopathy screening inference on input image bytes.
    Returns structured result object.
    """
    # Step 1: Retinal Image Quality Check
    is_valid_quality, quality_message = check_image_quality(image_bytes)
    if not is_valid_quality:
        return {
            "status": "IMAGE_QUALITY_FAILED",
            "message": quality_message
        }

    # Step 2: Check if model is loaded/ready
    if _model is None:
        # Re-attempt loading in case file was placed after startup
        if not load_model():
            return {
                "status": "MODEL_NOT_READY",
                "message": "The diabetic retinopathy model has not been trained or loaded yet."
            }

    # Step 3: Run real AI Model Inference
    try:
        input_tensor, original_rgb = preprocess_retinal_image(image_bytes)
        input_tensor = input_tensor.to(_device)

        with torch.no_grad():
            outputs = _model(input_tensor)
            probabilities = F.softmax(outputs, dim=1)[0]
            predicted_class = torch.argmax(probabilities).item()
            confidence = probabilities[predicted_class].item()

        severity = SEVERITY_CLASSES.get(predicted_class, "NO_DR")

        # Step 4: Generate Real Grad-CAM Heatmap
        with torch.enable_grad():
            grad_tensor, _ = preprocess_retinal_image(image_bytes)
            grad_tensor = grad_tensor.to(_device)
            heatmap_url = generate_and_save_gradcam(_model, grad_tensor, original_rgb, predicted_class)

        explanation = (
            f"The AI model (EfficientNet-B0) identified visual patterns in the retinal image "
            f"that contributed to the {severity.replace('_', ' ').title()} prediction with "
            f"{(confidence * 100):.1f}% confidence. The highlighted heatmap regions indicate "
            f"areas that had the strongest influence on the neural network's attention."
        )

        return {
            "status": "COMPLETED",
            "predictedClass": predicted_class,
            "severity": severity,
            "confidence": round(confidence, 4),
            "modelVersion": MODEL_VERSION,
            "heatmapPath": heatmap_url,
            "explanationText": explanation
        }
    except Exception as e:
        print(f"[INFERENCE ERROR] {e}")
        return {
            "status": "FAILED",
            "message": f"An error occurred during neural network inference: {str(e)}"
        }
