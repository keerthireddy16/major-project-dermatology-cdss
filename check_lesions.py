import pandas as pd

# Load prepared dataset
df = pd.read_csv("prepared_dataset.csv")

# Load original metadata to get lesion_id
metadata = pd.read_csv("ham10000_metadata_2026-08-26.csv")

# Add lesion_id
df = df.merge(
    metadata[["isic_id", "lesion_id"]],
    on="isic_id",
    how="left"
)

print("Total images:", len(df))
print("Unique lesions:", df["lesion_id"].nunique())

# Count images per lesion
images_per_lesion = df["lesion_id"].value_counts()

print("\nLesions with multiple images:",
      (images_per_lesion > 1).sum())

print("\nMaximum images for one lesion:",
      images_per_lesion.max())

print("\nImages per lesion:")
print(images_per_lesion.value_counts().sort_index())