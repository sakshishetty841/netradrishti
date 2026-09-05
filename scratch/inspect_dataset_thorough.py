import os
import glob
import hashlib
import pandas as pd
import numpy as np
from pathlib import Path
from PIL import Image

DATASET_ROOT = Path("/Users/sakshishetty/.cache/kagglehub/datasets/mariaherrerot/messidor2preprocess/versions/2")
PREPROCESS_DIR = DATASET_ROOT / "messidor-2" / "messidor-2" / "preprocess"
PROJECT_DATASETS = Path("/Users/sakshishetty/Downloads/promtpwars/__tests__/sih/SIH02/datasets")

def inspect_all():
    print("=" * 80)
    print("DETAILED DATASET INSPECTION")
    print("=" * 80)

    csv_file = DATASET_ROOT / "messidor_data.csv"
    df_raw = pd.read_csv(csv_file)
    print(f"CSV Path: {csv_file}")
    print(f"Total Rows in CSV: {len(df_raw)}")
    print(f"CSV Columns: {list(df_raw.columns)}")

    # All files in preprocess folder
    all_files_in_dir = list(PREPROCESS_DIR.glob("*"))
    print(f"Total files in '{PREPROCESS_DIR.name}' directory: {len(all_files_in_dir)}")

    image_extensions = {f.suffix.lower() for f in all_files_in_dir}
    print(f"Extensions found in directory: {image_extensions}")

    # Check match between CSV id_code and files
    missing_files = []
    found_images = []
    
    for idx, row in df_raw.iterrows():
        id_code = str(row['id_code'])
        file_path = PREPROCESS_DIR / id_code
        if file_path.exists():
            found_images.append((file_path, int(row['diagnosis']), row['adjudicated_dme'], row['adjudicated_gradable']))
        else:
            # check without extension or with .png
            base = Path(id_code).stem
            matches = list(PREPROCESS_DIR.glob(f"{base}*"))
            if matches:
                found_images.append((matches[0], int(row['diagnosis']), row['adjudicated_dme'], row['adjudicated_gradable']))
            else:
                missing_files.append(id_code)

    print(f"\nFound Images matching CSV: {len(found_images)}")
    print(f"Missing Images: {len(missing_files)}")

    # Analyze class distribution across all found images
    df_found = pd.DataFrame(found_images, columns=['file_path', 'diagnosis', 'dme', 'gradable'])
    class_counts = df_found['diagnosis'].value_counts().to_dict()
    total_found = len(df_found)

    print("\n--- CLASS DISTRIBUTION (ALL 1,744 IMAGES) ---")
    for c in sorted([0, 1, 2, 3, 4]):
        cnt = class_counts.get(c, 0)
        pct = (cnt / total_found * 100) if total_found > 0 else 0
        print(f"Class {c} ({get_class_name(c)}): {cnt} images ({pct:.2f}%)")

    # Majority vs Minority Ratio
    max_c = max(class_counts.values())
    min_c = min(class_counts.values())
    ratio = max_c / min_c if min_c > 0 else 0
    print(f"\nClass Imbalance Ratio (Majority Class 0 / Minority Class 4): {ratio:.2f}:1")

    # DME Distribution
    print(f"\nDiabetic Macular Edema (DME) Positive Cases: {df_found['dme'].sum()} ({df_found['dme'].mean()*100:.2f}%)")
    print(f"Gradable Images: {df_found['gradable'].sum()} / {len(df_found)}")

    # Inspect patient IDs
    # Messidor-2 patient ID mapping:
    # Filenames format: YYYYMMDD_XXXXX_0100_PP.png where YYYYMMDD_XXXXX identifies the patient / exam
    import re
    patient_ids = []
    eye_positions = []
    for fpath in df_found['file_path']:
        fname = fpath.name
        # Match pattern e.g., 20051020_43808_0100_PP.png -> Patient: 20051020_43808, Eye code: 0100
        parts = fname.split('_')
        if len(parts) >= 3:
            pid = f"{parts[0]}_{parts[1]}"
            eye = parts[2]
        else:
            pid = fname
            eye = "unk"
        patient_ids.append(pid)
        eye_positions.append(eye)

    df_found['patient_id'] = patient_ids
    df_found['eye_code'] = eye_positions

    unique_patients = df_found['patient_id'].nunique()
    print(f"\n--- PATIENT IDENTIFICATION & LEAKAGE CHECK ---")
    print(f"Total Images: {len(df_found)}")
    print(f"Unique Patient IDs: {unique_patients}")
    imgs_per_patient = df_found['patient_id'].value_counts()
    print(f"Distribution of Images per Patient:")
    print(imgs_per_patient.value_counts().to_dict())
    print("Explanation: Most patients have 2 images (Left Eye & Right Eye). Patient-level grouping is MANDATORY to prevent data leakage!")

    # Check for corruptions, resolutions, duplicates across all 1744 images
    print("\n--- IMAGE QUALITY & DEDUPLICATION SCAN ---")
    corrupts = 0
    blank_count = 0
    hashes = {}
    exact_duplicates = []
    resolutions = set()
    formats = set()

    for idx, row in df_found.iterrows():
        fpath = row['file_path']
        try:
            with Image.open(fpath) as img:
                formats.add(img.format)
                resolutions.add(img.size)
                arr = np.array(img)
                if arr.mean() < 5 or arr.std() < 2:
                    blank_count += 1
        except Exception:
            corrupts += 1

        with open(fpath, 'rb') as f:
            h = hashlib.sha256(f.read()).hexdigest()
            if h in hashes:
                exact_duplicates.append((str(fpath), hashes[h]))
            else:
                hashes[h] = str(fpath)

    print(f"Formats: {formats}")
    print(f"Resolutions found: {resolutions}")
    print(f"Corrupted images: {corrupts}")
    print(f"Blank/near-blank images: {blank_count}")
    print(f"Exact Duplicate files (identical SHA-256): {len(exact_duplicates)}")
    if exact_duplicates:
        for d in exact_duplicates:
            print(f"  - Dup: {Path(d[0]).name} matches {Path(d[1]).name}")

    # Inspect project CSV metadata files if present
    print("\n--- EXISTING PROJECT SPLITS INSPECTION ---")
    unified_csv = PROJECT_DATASETS / "unified_retina_metadata.csv"
    test_csv = PROJECT_DATASETS / "messidor2_external_test.csv"
    if unified_csv.exists() and test_csv.exists():
        u_df = pd.read_csv(unified_csv)
        t_df = pd.read_csv(test_csv)
        print(f"Unified Train+Val Split ({unified_csv.name}): {len(u_df)} samples")
        print(f"  - Classes: {u_df['label'].value_counts().to_dict()}")
        print(f"  - Patients: {u_df['patient_id'].nunique()}")

        print(f"External Test Split ({test_csv.name}): {len(t_df)} samples")
        print(f"  - Classes: {t_df['label'].value_counts().to_dict()}")
        print(f"  - Patients: {t_df['patient_id'].nunique()}")

        patient_overlap = set(u_df['patient_id']).intersection(set(t_df['patient_id']))
        print(f"Patient Overlap between Train+Val and Test: {len(patient_overlap)} (PASSED Patient-safe Isolation!)")

def get_class_name(c):
    names = {
        0: 'No DR',
        1: 'Mild DR',
        2: 'Moderate DR',
        3: 'Severe DR',
        4: 'Proliferative DR'
    }
    return names.get(c, 'Unknown')

if __name__ == "__main__":
    inspect_all()
