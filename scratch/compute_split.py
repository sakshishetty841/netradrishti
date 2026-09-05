import os
import re
import pandas as pd
from sklearn.model_selection import StratifiedGroupKFold

DATASET_ROOT = "/Users/sakshishetty/.cache/kagglehub/datasets/mariaherrerot/messidor2preprocess/versions/2"
CSV_PATH = os.path.join(DATASET_ROOT, "messidor_data.csv")

df = pd.read_csv(CSV_PATH)

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

df['patient_id'] = df['id_code'].apply(extract_patient_id)

sgkf = StratifiedGroupKFold(n_splits=10, shuffle=True, random_state=42)
splits = list(sgkf.split(df, df['diagnosis'], df['patient_id']))
train_val_idx, test_idx = splits[0]

test_df = df.iloc[test_idx]
train_val_df = df.iloc[train_val_idx]

sgkf_val = StratifiedGroupKFold(n_splits=9, shuffle=True, random_state=42)
val_splits = list(sgkf_val.split(train_val_df, train_val_df['diagnosis'], train_val_df['patient_id']))
train_idx_sub, val_idx_sub = val_splits[0]

train_df = train_val_df.iloc[train_idx_sub]
val_df = train_val_df.iloc[val_idx_sub]

print(f"Train set: {len(train_df)} images ({len(train_df)/len(df)*100:.2f}%)")
print(f"Val set: {len(val_df)} images ({len(val_df)/len(df)*100:.2f}%)")
print(f"Test set: {len(test_df)} images ({len(test_df)/len(df)*100:.2f}%)")

print("\nTrain class counts:", train_df['diagnosis'].value_counts().sort_index().to_dict())
print("Val class counts:", val_df['diagnosis'].value_counts().sort_index().to_dict())
print("Test class counts:", test_df['diagnosis'].value_counts().sort_index().to_dict())

# Verify no patient overlap
train_pats = set(train_df['patient_id'])
val_pats = set(val_df['patient_id'])
test_pats = set(test_df['patient_id'])

print("\nPatient Overlap Verification:")
print("Train & Val overlap:", len(train_pats.intersection(val_pats)))
print("Train & Test overlap:", len(train_pats.intersection(test_pats)))
print("Val & Test overlap:", len(val_pats.intersection(test_pats)))
