import pandas as pd
import os

# Load metadata
df = pd.read_csv("ham10000_metadata_2026-08-26.csv")

# Remove indeterminate cases
df = df[df["diagnosis_1"].isin(["Benign", "Malignant"])].copy()

# Create binary labels
df["label"] = df["diagnosis_1"].map({
    "Benign": 0,
    "Malignant": 1
})

# Create image path
df["image_path"] = df["isic_id"].apply(
    lambda x: os.path.join("ISIC-images", x + ".jpg")
)

# Check that images exist
df["image_exists"] = df["image_path"].apply(os.path.exists)

print("Total usable images:", len(df))
print("Benign:", (df["label"] == 0).sum())
print("Malignant:", (df["label"] == 1).sum())
print("Missing image files:", (~df["image_exists"]).sum())

# Keep only records with existing images
df = df[df["image_exists"]].copy()

# Save prepared dataset
df[
    ["isic_id", "image_path", "diagnosis_1", "label"]
].to_csv("prepared_dataset.csv", index=False)

print("\nPrepared dataset saved as prepared_dataset.csv")