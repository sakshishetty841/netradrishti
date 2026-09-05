import re
import pandas as pd
from pathlib import Path

csv_path = Path("/Users/sakshishetty/.cache/kagglehub/datasets/mariaherrerot/messidor2preprocess/versions/2/messidor_data.csv")
df = pd.read_csv(csv_path)

def get_pid(name):
    name = Path(name).stem
    # Match date + exam number e.g. 20051020_43808_0100_PP -> 20051020_43808
    match = re.match(r'^(\d+_\d+)', name)
    if match:
        return match.group(1)
    return name

df['patient_id'] = df['id_code'].apply(get_pid)
print(f"Total Images: {len(df)}")
print(f"Unique Patients: {df['patient_id'].nunique()}")
print("Images per patient distribution:")
print(df['patient_id'].value_counts().value_counts().to_dict())
