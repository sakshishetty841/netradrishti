import io
import cv2
import numpy as np
from PIL import Image
import torch
from torchvision import transforms

def check_image_quality(image_bytes: bytes) -> tuple[bool, str]:
    """
    Validates retinal fundus image quality prior to model inference.
    Detects unreadable files, zero dimensions, or extreme brightness/darkness.
    """
    try:
        pil_img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    except Exception as e:
        return False, f"Corrupted or invalid image format: {str(e)}"

    arr = np.array(pil_img)
    if arr.size == 0 or arr.shape[0] < 50 or arr.shape[1] < 50:
        return False, "Retinal image dimensions are too small (minimum required: 50x50 pixels)."

    # Compute mean brightness across RGB channels
    gray = cv2.cvtColor(arr, cv2.COLOR_RGB2GRAY)
    mean_brightness = np.mean(gray)
    std_brightness = np.std(gray)

    if mean_brightness < 5.0:
        return False, "Image is extremely dark or completely black. Please capture a clear retinal fundus photo."

    if mean_brightness > 250.0 and std_brightness < 5.0:
        return False, "Image is overexposed or solid white. Please capture a clear retinal fundus photo."

    return True, "OK"

def crop_retina_border(cv_img: np.ndarray, tol: int = 7) -> np.ndarray:
    """
    Crops unnecessary black borders from retinal fundus photographs.
    """
    if cv_img.ndim == 2:
        mask = cv_img > tol
        return cv_img[np.ix_(mask.any(1), mask.any(0))]
    elif cv_img.ndim == 3:
        gray = cv2.cvtColor(cv_img, cv2.COLOR_RGB2GRAY)
        mask = gray > tol
        check_shape = cv_img[np.ix_(mask.any(1), mask.any(0))]
        if check_shape.shape[0] == 0 or check_shape.shape[1] == 0:
            return cv_img
        return check_shape
    return cv_img

def preprocess_retinal_image(image_bytes: bytes) -> tuple[torch.Tensor, np.ndarray]:
    """
    Preprocesses raw retinal image bytes for PyTorch EfficientNet inference.
    Returns PyTorch tensor (1, 3, 224, 224) and original RGB numpy array for Grad-CAM overlay.
    """
    pil_img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    rgb_arr = np.array(pil_img)

    cropped_arr = crop_retina_border(rgb_arr)
    resized_rgb = cv2.resize(cropped_arr, (224, 224), interpolation=cv2.INTER_AREA)

    # PyTorch ImageNet normalization pipeline
    transform_pipeline = transforms.Compose([
        transforms.ToPILImage(),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ])

    tensor = transform_pipeline(resized_rgb).unsqueeze(0)  # (1, 3, 224, 224)
    return tensor, resized_rgb
