import pandas as pd
from sklearn.model_selection import StratifiedGroupKFold

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

# Create stratified group splitter
sgkf = StratifiedGroupKFold(
    n_splits=5,
    shuffle=True,
    random_state=42
)

# First split:
# 80% temporary training data
# 20% test data
train_idx, test_idx = next(
    sgkf.split(
        df,
        y=df["label"],
        groups=df["lesion_id"]
    )
)

train_df = df.iloc[train_idx].copy()
test_df = df.iloc[test_idx].copy()

# Second split:
# Split the 80% training portion into
# approximately 70% final training and 10% validation
sgkf2 = StratifiedGroupKFold(
    n_splits=4,
    shuffle=True,
    random_state=42
)

train_idx2, val_idx = next(
    sgkf2.split(
        train_df,
        y=train_df["label"],
        groups=train_df["lesion_id"]
    )
)

final_train_df = train_df.iloc[train_idx2].copy()
val_df = train_df.iloc[val_idx].copy()

# Save the splits
final_train_df.to_csv("train.csv", index=False)
val_df.to_csv("validation.csv", index=False)
test_df.to_csv("test.csv", index=False)

# Print information
print("TRAIN")
print("Images:", len(final_train_df))
print("Lesions:", final_train_df["lesion_id"].nunique())
print(final_train_df["label"].value_counts())
print()

print("VALIDATION")
print("Images:", len(val_df))
print("Lesions:", val_df["lesion_id"].nunique())
print(val_df["label"].value_counts())
print()

print("TEST")
print("Images:", len(test_df))
print("Lesions:", test_df["lesion_id"].nunique())
print(test_df["label"].value_counts())
print()

# Check that no lesion occurs in more than one split
train_lesions = set(final_train_df["lesion_id"])
val_lesions = set(val_df["lesion_id"])
test_lesions = set(test_df["lesion_id"])

print("Train/Validation overlap:", len(train_lesions & val_lesions))
print("Train/Test overlap:", len(train_lesions & test_lesions))
print("Validation/Test overlap:", len(val_lesions & test_lesions))