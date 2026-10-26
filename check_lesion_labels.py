import pandas as pd

# Load prepared dataset
df = pd.read_csv("prepared_dataset.csv")

# Load original metadata
metadata = pd.read_csv("ham10000_metadata_2026-08-26.csv")

# Add lesion_id
df = df.merge(
    metadata[["isic_id", "lesion_id"]],
    on="isic_id",
    how="left"
)

# Count unique labels for each lesion
label_counts = df.groupby("lesion_id")["label"].nunique()

# Lesions having more than one label
conflicting = label_counts[label_counts > 1]

print("Total unique lesions:", df["lesion_id"].nunique())
print("Lesions with conflicting labels:", len(conflicting))

if len(conflicting) > 0:
    print("\nConflicting lesion IDs:")
    print(conflicting)
else:
    print("\nNo conflicting lesion labels found.")