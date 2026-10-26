import pandas as pd
import os

# Load metadata
df = pd.read_csv("ham10000_metadata_2026-08-26.csv")

print("Total metadata records:", len(df))

# Image folder
image_folder = "ISIC-images"

# Check whether every metadata image exists
missing_images = []

for isic_id in df["isic_id"]:
    image_path = os.path.join(image_folder, isic_id + ".jpg")

    if not os.path.exists(image_path):
        missing_images.append(isic_id)

print("\nMissing image files:", len(missing_images))

if missing_images:
    print("First few missing images:")
    print(missing_images[:10])

# Check duplicate ISIC IDs
duplicates = df["isic_id"].duplicated().sum()

print("\nDuplicate ISIC IDs:", duplicates)

# Check missing diagnosis_3
missing_diagnosis = df["diagnosis_3"].isna().sum()

print("\nMissing diagnosis_3:", missing_diagnosis)

# Show those records
if missing_diagnosis > 0:
    print("\nRecords with missing diagnosis_3:")
    print(df[df["diagnosis_3"].isna()][
        ["isic_id", "diagnosis_1", "diagnosis_2", "diagnosis_3"]
    ])