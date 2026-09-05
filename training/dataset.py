import os
import cv2
import pandas as pd
import numpy as np
from PIL import Image
import torch
from torch.utils.data import Dataset
from torchvision import transforms

def crop_retina_border(cv_img: np.ndarray, tol: int = 7) -> np.ndarray:
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

class RetinalDataset(Dataset):
    def __init__(self, metadata_csv: str, is_train: bool = True, img_size: int = 224, preload: bool = True):
        self.df = pd.read_csv(metadata_csv)
        self.is_train = is_train
        self.img_size = img_size

        if is_train:
            self.transform = transforms.Compose([
                transforms.RandomHorizontalFlip(p=0.5),
                transforms.RandomRotation(degrees=15),
                transforms.ColorJitter(brightness=0.2, contrast=0.2),
                transforms.ToTensor(),
                transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
            ])
        else:
            self.transform = transforms.Compose([
                transforms.ToTensor(),
                transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
            ])

        self.cache = []
        if preload:
            for idx in range(len(self.df)):
                row = self.df.iloc[idx]
                img_path = row["image_path"]
                label = int(row["label"])
                if os.path.exists(img_path):
                    pil_img = Image.open(img_path).convert("RGB")
                    if pil_img.size != (self.img_size, self.img_size):
                        pil_img = pil_img.resize((self.img_size, self.img_size), Image.BILINEAR)
                    self.cache.append((pil_img, label))
                else:
                    self.cache.append(None)

    def __len__(self):
        return len(self.df)

    def __getitem__(self, idx):
        if self.cache and self.cache[idx] is not None:
            pil_img, label = self.cache[idx]
        else:
            row = self.df.iloc[idx]
            img_path = row["image_path"]
            label = int(row["label"])
            pil_img = Image.open(img_path).convert("RGB")
            if pil_img.size != (self.img_size, self.img_size):
                pil_img = pil_img.resize((self.img_size, self.img_size), Image.BILINEAR)

        tensor = self.transform(pil_img)
        return tensor, torch.tensor(label, dtype=torch.long)
