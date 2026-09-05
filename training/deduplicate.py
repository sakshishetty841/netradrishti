import hashlib
import pandas as pd
from pathlib import Path
from config import UNIFIED_METADATA_CSV

def compute_image_hash(filepath: str) -> str:
    """Computes SHA-256 hash of image file bytes."""
    hasher = hashlib.sha256()
    with open(filepath, "rb") as f:
        while chunk := f.read(8192):
            hasher.update(chunk)
    return hasher.hexdigest()

def remove_duplicate_images(csv_path: str):
    """
    Scans metadata CSV for duplicate image files based on SHA-256 content hashes.
    Deduplicates dataset in-place.
    """
    if not Path(csv_path).exists():
        print(f"[DEDUPLICATOR] CSV file not found: {csv_path}")
        return

    df = pd.read_csv(csv_path)
    print(f"[DEDUPLICATOR] Checking {len(df)} images for exact duplicates...")

    seen_hashes = set()
    clean_records = []
    duplicates_count = 0

    for _, row in df.iterrows():
        img_path = row["image_path"]
        if not Path(img_path).exists():
            continue

        file_hash = compute_image_hash(img_path)
        if file_hash in seen_hashes:
            duplicates_count += 1
        else:
            seen_hashes.add(file_hash)
            clean_records.append(row.to_dict())

    clean_df = pd.DataFrame(clean_records)
    clean_df.to_csv(csv_path, index=False)

    print(f"[DEDUPLICATOR] Removed {duplicates_count} duplicate images. Clean dataset size: {len(clean_df)} samples.")

if __name__ == "__main__":
    remove_duplicate_images(str(UNIFIED_METADATA_CSV))
