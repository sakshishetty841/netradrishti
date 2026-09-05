import os
import re
import glob
import pandas as pd
from pathlib import Path
from sklearn.model_selection import StratifiedGroupKFold
from config import DATASETS_DIR, UNIFIED_METADATA_CSV, EXTERNAL_TEST_CSV

def extract_patient_id(filename):
    name = os.path.splitext(filename)[0]
    match1 = re.match(r'^(\d+_\d+)_\d+_PP', name)
    if match1:
        return match1.group(1)
    match2 = re.match(r'^(IM\d{4})', name, re.IGNORECASE)
    if match2:
        num = int(re.search(r'\d+', name).group())
        patient_num = (num - 1) // 2
        return f"IM_PATIENT_{patient_num}"
    return name

def convert_all_datasets():
    """
    Scans datasets directory and kagglehub cache for Messidor-2 and other DR datasets.
    Generates unified metadata CSV (image_path, label, source, patient_id) with strict patient-level split.
    """
    records = []
    
    print("[DATASET CONVERTER] Scanning dataset directories...")

    # Messidor-2 paths to search
    messidor_locations = [
        DATASETS_DIR / "messidor2",
        Path("/Users/sakshishetty/.cache/kagglehub/datasets/mariaherrerot/messidor2preprocess/versions/2")
    ]

    messidor_dir = None
    messidor_csv = None
    images_subfolder = None

    for loc in messidor_locations:
        if (loc / "messidor_data.csv").exists():
            messidor_csv = loc / "messidor_data.csv"
            messidor_dir = loc
            # Check for image directories
            if (loc / "messidor-2" / "messidor-2" / "preprocess").exists():
                images_subfolder = loc / "messidor-2" / "messidor-2" / "preprocess"
            elif (loc / "images").exists():
                images_subfolder = loc / "images"
            elif (loc / "preprocess").exists():
                images_subfolder = loc / "preprocess"
            break

    if messidor_csv and messidor_csv.exists() and images_subfolder:
        print(f"[DATASET CONVERTER] Found Messidor-2 dataset at '{messidor_dir}'")
        df = pd.read_csv(messidor_csv)
        for _, row in df.iterrows():
            img_id = str(row.get("id_code", row.iloc[0]))
            diagnosis = int(row.get("diagnosis", row.get("adgrade", 0)))
            img_path = images_subfolder / img_id
            if not img_path.exists():
                # Try finding matching file
                base = os.path.splitext(img_id)[0]
                matches = list(images_subfolder.glob(f"{base}.*"))
                if matches:
                    img_path = matches[0]

            if img_path.exists():
                pat_id = extract_patient_id(img_id)
                records.append({
                    "image_path": str(img_path),
                    "label": int(diagnosis),
                    "source": "messidor2",
                    "patient_id": pat_id
                })

    if not records:
        print(f"[DATASET CONVERTER] No valid images found.")
        return

    full_df = pd.DataFrame(records)
    print(f"[DATASET CONVERTER] Total records gathered: {len(full_df)} samples.")

    # Deduplication: remove duplicate image content files
    # (Identified 4 exact content duplicates in Messidor-2 inspection)
    import hashlib
    hashes = {}
    unique_indices = []
    for idx, row in full_df.iterrows():
        fpath = row['image_path']
        with open(fpath, 'rb') as f:
            h = hashlib.md5(f.read()).hexdigest()
            if h not in hashes:
                hashes[h] = fpath
                unique_indices.append(idx)

    full_df = full_df.iloc[unique_indices].reset_index(drop=True)
    print(f"[DATASET CONVERTER] After deduplication: {len(full_df)} samples.")

    # Patient-Stratified Split: 80% Train, 10% Val, 10% Test
    sgkf = StratifiedGroupKFold(n_splits=10, shuffle=True, random_state=42)
    splits = list(sgkf.split(full_df, full_df['label'], full_df['patient_id']))
    train_val_idx, test_idx = splits[0]

    test_df = full_df.iloc[test_idx].reset_index(drop=True)
    train_val_df = full_df.iloc[train_val_idx].reset_index(drop=True)

    # Save Train+Val unified metadata and External Test metadata
    UNIFIED_METADATA_CSV.parent.mkdir(parents=True, exist_ok=True)
    train_val_df.to_csv(UNIFIED_METADATA_CSV, index=False)
    test_df.to_csv(EXTERNAL_TEST_CSV, index=False)

    print(f"[DATASET CONVERTER] Unified Train+Val metadata saved to '{UNIFIED_METADATA_CSV}' ({len(train_val_df)} samples).")
    print(f"[DATASET CONVERTER] Messidor-2 External Test set saved to '{EXTERNAL_TEST_CSV}' ({len(test_df)} samples).")

if __name__ == "__main__":
    convert_all_datasets()

