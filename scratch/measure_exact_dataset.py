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

def measure():
    print("=" * 80)
    print("EXACT MEASUREMENT OF MESSIDOR-2 DATASET")
    print("=" * 80)

    csv_path = DATASET_ROOT / "messidor_data.csv"
    df = pd.read_csv(csv_path)
    print(f"CSV File: {csv_path}")
    print(f"Total Rows: {len(df)}")
    print(f"CSV Columns: {list(df.columns)}")
    print("\nFirst 5 CSV Rows:")
    print(df.head(5))

    # Exact Label Mapping Verification
    print("\n--- LABEL MAPPING VERIFICATION ---")
    label_values = sorted(df['diagnosis'].unique())
    print(f"Unique values in 'diagnosis' column: {label_values}")
    
    # Check if there's any text or other mapping files
    mapping_dict = {
        0: "No Diabetic Retinopathy (No DR)",
        1: "Mild Diabetic Retinopathy (Mild DR)",
        2: "Moderate Diabetic Retinopathy (Moderate DR)",
        3: "Severe Diabetic Retinopathy (Severe DR)",
        4: "Proliferative Diabetic Retinopathy (Proliferative DR)"
    }
    print("Verified Label Mapping:")
    for k in label_values:
        print(f"  Grade {k} -> {mapping_dict.get(k, 'Unknown')}")

    # File counts
    all_files = list(PREPROCESS_DIR.glob("*"))
    png_files = [f for f in all_files if f.suffix.lower() == '.png']
    jpg_files = [f for f in all_files if f.suffix.lower() in ['.jpg', '.jpeg']]
    other_files = [f for f in all_files if f.suffix.lower() not in ['.png', '.jpg', '.jpeg']]

    print(f"\nTotal files in preprocess folder: {len(all_files)}")
    print(f"  - PNG images: {len(png_files)}")
    print(f"  - JPG/JPEG images: {len(jpg_files)}")
    print(f"  - Invalid/Other files: {len(other_files)}")

    # Detailed image property scan
    sizes = []
    channels = set()
    corrupt_count = 0
    unreadable_count = 0
    blank_count = 0
    very_small = 0
    very_large = 0
    aspect_ratios = []

    hashes = {}
    exact_dups = []

    print("\nScanning images for exact resolutions, channels, quality, and hashes...")
    for fpath in all_files:
        # Check hashes
        with open(fpath, 'rb') as f:
            file_hash = hashlib.sha256(f.read()).hexdigest()
            if file_hash in hashes:
                exact_dups.append((fpath.name, Path(hashes[file_hash]).name))
            else:
                hashes[file_hash] = str(fpath)

        try:
            with Image.open(fpath) as img:
                w, h = img.size
                sizes.append((w, h))
                aspect_ratios.append(w / h)
                mode = img.mode
                channels.add(mode)

                if w < 224 or h < 224:
                    very_small += 1
                if w > 2048 or h > 2048:
                    very_large += 1

                arr = np.array(img)
                if arr.mean() < 5 or arr.std() < 2:
                    blank_count += 1
        except Exception as e:
            corrupt_count += 1
            unreadable_count += 1

    unique_sizes = set(sizes)
    min_w = min([s[0] for s in sizes])
    max_w = max([s[0] for s in sizes])
    min_h = min([s[1] for s in sizes])
    max_h = max([s[1] for s in sizes])

    min_aspect = min(aspect_ratios)
    max_aspect = max(aspect_ratios)

    print(f"\nImage Resolutions: Min=({min_w}, {min_h}), Max=({max_w}, {max_h}), Set of resolutions={unique_sizes}")
    print(f"Color Channels/Modes: {channels}")
    print(f"Aspect Ratio Range: {min_aspect:.4f} to {max_aspect:.4f}")
    print(f"Corrupted Images: {corrupt_count}")
    print(f"Unreadable Images: {unreadable_count}")
    print(f"Very Small Images (<224x224): {very_small}")
    print(f"Very Large Images (>2048x2048): {very_large}")
    print(f"Blank/Near-Blank Images: {blank_count}")
    print(f"Exact Duplicate Files: {len(exact_dups)}")
    for d in exact_dups:
        print(f"  Duplicate: {d[0]} matches {d[1]}")

    # Patient / Exam IDs
    print("\n--- PATIENT & EXAMINATION INFORMATION ---")
    df['patient_prefix'] = df['id_code'].apply(lambda x: Path(x).stem.split('_')[0] + "_" + Path(x).stem.split('_')[1] if '_' in x else Path(x).stem)
    print(f"Unique id_code (Image IDs): {df['id_code'].nunique()}")
    print(f"Unique Patient / Exam Prefixes: {df['patient_prefix'].nunique()}")
    print(f"Images per patient distribution: {df['patient_prefix'].value_counts().value_counts().to_dict()}")

    # Class Counts
    print("\n--- EXACT CLASS DISTRIBUTION ---")
    counts = df['diagnosis'].value_counts().sort_index().to_dict()
    total = len(df)
    for c in range(5):
        cnt = counts.get(c, 0)
        pct = (cnt / total * 100)
        print(f"Class {c} ({mapping_dict[c]}): {cnt} images ({pct:.2f}%)")
    print(f"Total: {total} images")

    maj_class = max(counts, key=counts.get)
    min_class = min(counts, key=counts.get)
    ratio = counts[maj_class] / counts[min_class]
    print(f"Majority Class: Class {maj_class} ({counts[maj_class]} images)")
    print(f"Minority Class: Class {min_class} ({counts[min_class]} images)")
    print(f"Majority / Minority Ratio: {ratio:.2f} : 1")

    # Existing Splits
    print("\n--- EXISTING SPLITS IN PROJECT ---")
    unified_csv = PROJECT_DATASETS / "unified_retina_metadata.csv"
    test_csv = PROJECT_DATASETS / "messidor2_external_test.csv"
    if sorted([unified_csv.exists(), test_csv.exists()]):
        u_df = pd.read_csv(unified_csv)
        t_df = pd.read_csv(test_csv)
        print(f"Unified Train+Val Split ({unified_csv.name}): {len(u_df)} samples")
        print(f"  Distribution: {u_df['label'].value_counts().sort_index().to_dict()}")

        print(f"External Test Split ({test_csv.name}): {len(t_df)} samples")
        print(f"  Distribution: {t_df['label'].value_counts().sort_index().to_dict()}")

        overlap = set(u_df['patient_id']).intersection(set(t_df['patient_id']))
        print(f"Patient Overlap between Train+Val and Test: {len(overlap)} patients")

if __name__ == "__main__":
    measure()
