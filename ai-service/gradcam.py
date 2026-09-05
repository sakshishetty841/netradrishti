import os
import uuid
import cv2
import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
import config as ai_config
OUTPUT_DIR = getattr(ai_config, "OUTPUT_DIR", os.path.join(os.path.dirname(__file__), "outputs", "heatmaps"))
os.makedirs(OUTPUT_DIR, exist_ok=True)

class GradCAM:
    def __init__(self, model: nn.Module, target_layer: nn.Module):
        self.model = model
        self.target_layer = target_layer
        self.gradients = None
        self.activations = None

        self.target_layer.register_forward_hook(self.save_activation)
        self.target_layer.register_full_backward_hook(self.save_gradient)

    def save_activation(self, module, input, output):
        self.activations = output

    def save_gradient(self, module, grad_input, grad_output):
        self.gradients = grad_output[0]

    def generate_heatmap(self, input_tensor: torch.Tensor, class_idx: int) -> np.ndarray:
        self.model.eval()
        self.gradients = None
        self.activations = None

        output = self.model(input_tensor)

        if class_idx is None:
            class_idx = torch.argmax(output, dim=1).item()

        score = output[0, class_idx]
        self.model.zero_grad()
        score.backward(retain_graph=True)

        gradients = self.gradients.data.cpu().numpy()[0]  # shape (C, H, W)
        activations = self.activations.data.cpu().numpy()[0]  # shape (C, H, W)

        weights = np.mean(gradients, axis=(1, 2))  # (C,)
        cam = np.zeros(activations.shape[1:], dtype=np.float32)

        for i, w in enumerate(weights):
            cam += w * activations[i, :, :]

        cam = np.maximum(cam, 0)  # ReLU on map
        if np.max(cam) > 0:
            cam = cam / np.max(cam)  # normalize to [0, 1]

        return cam

def generate_and_save_gradcam(
    model: nn.Module,
    input_tensor: torch.Tensor,
    original_rgb: np.ndarray,
    predicted_class: int
) -> str:
    """
    Generates Grad-CAM heatmap overlay for EfficientNet-B0 and saves image file.
    Returns relative URL path for web access.
    """
    try:
        if hasattr(model, 'backbone') and hasattr(model.backbone, 'features'):
            target_layer = model.backbone.features[-1]
        elif hasattr(model, 'features'):
            target_layer = model.features[-1]
        elif hasattr(model, 'layer4'):
            target_layer = model.layer4[-1]
        else:
            target_layer = list(model.children())[-1]

        grad_cam = GradCAM(model, target_layer)
        cam = grad_cam.generate_heatmap(input_tensor, predicted_class)

        # Resize heatmap to match original RGB image size (224, 224)
        heatmap_resized = cv2.resize(cam, (original_rgb.shape[1], original_rgb.shape[0]))
        heatmap_uint8 = np.uint8(255 * heatmap_resized)

        # Apply JET colormap
        heatmap_colored = cv2.applyColorMap(heatmap_uint8, cv2.COLORMAP_JET)
        heatmap_rgb = cv2.cvtColor(heatmap_colored, cv2.COLOR_BGR2RGB)

        # Overlay heatmap on original retina image
        overlay = cv2.addWeighted(original_rgb, 0.6, heatmap_rgb, 0.4, 0)
        overlay_bgr = cv2.cvtColor(overlay, cv2.COLOR_RGB2BGR)

        filename = f"heatmap-{uuid.uuid4().hex[:12]}.jpg"
        save_path = os.path.join(OUTPUT_DIR, filename)

        cv2.imwrite(save_path, overlay_bgr)
        return f"/ai-outputs/heatmaps/{filename}"
    except Exception as e:
        print(f"[GRAD-CAM ERROR] Failed to generate heatmap: {e}")
        return ""
