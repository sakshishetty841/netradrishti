import os
import re
import hashlib
import numpy as np
import pandas as pd
from PIL import Image
import cv2

DATASET_ROOT = "/Users/sakshishetty/.cache/kagglehub/datasets/mariaherrerot/messidor2preprocess/versions/2"
CSV_PATH = os.path.join(DATASET_ROOT, "messidor_data.csv")
IMAGES_DIR = os.path.join(DATASET_ROOT, "messidor-2", "messidor-2", "preprocess")

print("==================================================")
print("COMPREHENSIVE MESSIDOR-2 DATASET INSPECTION")
print("==================================================")

# 1. LOCATE DATASET
print("\n--- 1. LOCATE DATASET ---")
print(f"Dataset Path: {DATASET_ROOT}")
print(f"CSV Path: {CSV_PATH}")
print(f"Images Dir: {IMAGES_DIR}")

df = pd.read_csv(CSV_PATH)
print(f"CSV Total Rows: {len(df)}")
print(f"CSV Columns: {list(df.columns)}")

image_files = os.listdir(IMAGES_DIR)
print(f"Total Image Files on Disk: {len(image_files)}")

# File extensions breakdown
ext_counts = {}
for f in image_files:
    ext = os.path.splitext(f)[1].lower()
    ext_counts[ext] = ext_counts.get(ext, 0) + 1
print(f"Image Formats / Extensions on Disk: {ext_counts}")

# Check matching between CSV id_code and disk images
df_ids = set(df['id_code'].values)
disk_ids = set(image_files)

# Handle case where id_code might not have extension or different extension
missing_in_disk = []
for idc in df['id_code'].values:
    if idc not in disk_ids:
        missing_in_disk.append(idc)

print(f"CSV Entries Missing Corresponding Disk Image: {len(missing_in_disk)}")
if missing_in_disk:
    print(f"Sample missing: {missing_in_disk[:5]}")

# 2. CLASS DISTRIBUTION
print("\n--- 2. CLASS DISTRIBUTION ---")
print("Diagnosis column counts (0..4):")
diag_counts = df['diagnosis'].value_counts(dropna=False).sort_index()
print(diag_counts.to_dict())

label_map = {
    0: "No DR",
    1: "Mild",
    2: "Moderate",
    3: "Severe",
    4: "Proliferative DR"
}

total_valid_labels = df['diagnosis'].dropna().count()
print("\nDetailed Class Distribution:")
for k in range(5):
    cnt = (df['diagnosis'] == k).sum()
    pct = (cnt / total_valid_labels) * 100 if total_valid_labels > 0 else 0
    print(f"Class {k} ({label_map.get(k, 'Unknown')}): {cnt} images ({pct:.2f}%)")

null_labels = df['diagnosis'].isna().sum()
print(f"Missing / NaN Labels: {null_labels}")

# Check gradability
if 'adjudicated_gradable' in df.columns:
    ungradable = (df['adjudicated_gradable'] == 0).sum()
    print(f"Ungradable Images (adjudicated_gradable == 0): {ungradable}")

# 3. DATA QUALITY INSPECTION
print("\n--- 3. DATA QUALITY & CORRUPTION CHECK ---")
corrupted_files = []
unreadable_files = []
image_shapes = {}
blank_images = []
md5_hashes = {}
duplicate_files = [] # same hash, different filename

for idx, row in df.iterrows():
    fname = str(row['id_code'])
    fpath = os.path.join(IMAGES_DIR, fname)
    
    if not os.path.exists(fpath):
        # try finding without extension or matching basename
        base = os.path.splitext(fname)[0]
        matches = [f for f in image_files if f.startswith(base)]
        if matches:
            fpath = os.path.join(IMAGES_DIR, matches[0])
        else:
            unreadable_files.append(fname)
            continue
            
    try:
        with Image.open(fpath) as img:
            w, h = img.size
            mode = img.mode
            shape_key = (w, h, mode)
            image_shapes[shape_key] = image_shapes.get(shape_key, 0) + 1
            
            # Check blank / near-blank
            img_np = np.array(img)
            mean_val = img_np.mean()
            std_val = img_np.std()
            if mean_val < 5.0 or std_val < 2.0:
                blank_images.append((fname, mean_val, std_val))
                
        # MD5 duplicate check
        with open(fpath, 'rb') as fp:
            file_hash = hashlib.md5(fp.read()).hexdigest()
            if file_hash in md5_hashes:
                duplicate_files.append((fname, md5_hashes[file_hash]))
            else:
                md5_hashes[file_hash] = fname
                
    except Exception as e:
        corrupted_files.append((fname, str(e)))

print(f"Corrupted Images: {len(corrupted_files)}")
print(f"Unreadable / Missing Image Files: {len(unreadable_files)}")
print(f"Exact Duplicate Image Content Files: {len(duplicate_files)}")
if duplicate_files:
    print("Sample Duplicates:", duplicate_files[:3])
print(f"Blank / Near-blank Images: {len(blank_images)}")
print("\nImage Dimensions & Modes breakdown:")
for shape, count in image_shapes.items():
    print(f"  Width x Height: {shape[0]}x{shape[1]}, Mode: {shape[2]} -> Count: {count}")

# 4. PATIENT ID & LEAKAGE CHECK
print("\n--- 4. PATIENT ID & DATA LEAKAGE ANALYSIS ---")

def extract_patient_id(filename):
    # Messidor-2 filename formats:
    # 1) 20051020_43808_0100_PP.png -> Patient/Exam date & ID '20051020_43808'
    # 2) IM000161.JPG -> Messidor original style, IM000161 paired with IM000162 etc.
    name = os.path.splitext(filename)[0]
    match1 = re.match(r'^(\d+_\d+)_\d+_PP', name)
    if match1:
        return match1.group(1)
    
    match2 = re.match(r'^(IM\d{4})', name, re.IGNORECASE)
    if match2:
        # Messidor 1 style images: often 2 images per eye/patient
        # integer id
        num = int(re.search(r'\d+', name).group())
        patient_num = (num - 1) // 2
        return f"IM_PATIENT_{patient_num}"
    
    return name

df['patient_id'] = df['id_code'].apply(extract_patient_id)
unique_patients = df['patient_id'].nunique()
print(f"Extracted Unique Patient / Exam IDs: {unique_patients}")
images_per_patient = df['patient_id'].value_counts()
print(f"Max images per patient: {images_per_patient.max()}, Min: {images_per_patient.min()}, Mean: {images_per_patient.mean():.2f}")
print("Distribution of images per patient:")
print(images_per_patient.value_counts().to_dict())

# 5. CLASS IMBALANCE METRICS
print("\n--- 5. CLASS IMBALANCE METRICS ---")
min_count = diag_counts.min()
max_count = diag_counts.max()
imbalance_ratio = max_count / min_count if min_count > 0 else float('inf')
print(f"Max Class Count (Class 0): {max_count}")
print(f"Min Class Count (Class 4): {min_count}")
print(f"Imbalance Ratio (Max / Min): {imbalance_ratio:.2f}:1")

print("\nInspection Complete!")
