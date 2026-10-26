import pandas as pd
import torch
from torch.utils.data import Dataset, DataLoader
from torchvision import transforms
from torchvision.models import efficientnet_b0
from PIL import Image
from sklearn.metrics import (
    accuracy_score,
    recall_score,
    f1_score,
    confusion_matrix,
    classification_report
)
import torch.nn as nn


# ==========================================
# 1. Device
# ==========================================

device = torch.device(
    "cuda" if torch.cuda.is_available() else "cpu"
)

print("Using device:", device)


# ==========================================
# 2. Load test dataset
# ==========================================

test_df = pd.read_csv("/content/test.csv")

print("Test images:", len(test_df))


# ==========================================
# 3. Image transformations
# ==========================================

test_transform = transforms.Compose([

    transforms.Resize((224, 224)),

    transforms.ToTensor(),

    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    )
])


# ==========================================
# 4. Dataset class
# ==========================================

class SkinLesionDataset(Dataset):

    def __init__(self, dataframe, transform=None):

        self.dataframe = dataframe.reset_index(drop=True)

        self.transform = transform


    def __len__(self):

        return len(self.dataframe)


    def __getitem__(self, index):

        image_path = self.dataframe.loc[
            index,
            "image_path"
        ]

        # Convert Windows path to Linux path
        image_path = image_path.replace(
            "\\",
            "/"
        )

        # Add Colab directory
        image_path = "/content/" + image_path

        label = self.dataframe.loc[
            index,
            "label"
        ]

        image = Image.open(
            image_path
        ).convert("RGB")

        if self.transform:

            image = self.transform(image)

        return (
            image,
            torch.tensor(
                label,
                dtype=torch.long
            )
        )


# ==========================================
# 5. Create test dataset
# ==========================================

test_dataset = SkinLesionDataset(
    test_df,
    test_transform
)


# ==========================================
# 6. Create DataLoader
# ==========================================

test_loader = DataLoader(

    test_dataset,

    batch_size=16,

    shuffle=False,

    num_workers=0,

    pin_memory=True
)


# ==========================================
# 7. Load EfficientNet-B0
# ==========================================

model = efficientnet_b0(
    weights=None
)


# Replace classifier

model.classifier[1] = nn.Linear(
    model.classifier[1].in_features,
    2
)


# Load best trained model

model.load_state_dict(
    torch.load(
        "/content/best_model.pth",
        map_location=device
    )
)


model = model.to(device)

model.eval()


print("Best model loaded successfully.")


# ==========================================
# 8. Test evaluation
# ==========================================

all_predictions = []

all_labels = []


with torch.no_grad():

    for images, labels in test_loader:

        images = images.to(
            device,
            non_blocking=True
        )

        labels = labels.to(
            device,
            non_blocking=True
        )

        outputs = model(images)

        predictions = torch.argmax(
            outputs,
            dim=1
        )

        all_predictions.extend(
            predictions.cpu().numpy()
        )

        all_labels.extend(
            labels.cpu().numpy()
        )


# ==========================================
# 9. Calculate metrics
# ==========================================

accuracy = accuracy_score(
    all_labels,
    all_predictions
)

recall = recall_score(
    all_labels,
    all_predictions,
    zero_division=0
)

f1 = f1_score(
    all_labels,
    all_predictions,
    zero_division=0
)


# ==========================================
# 10. Print results
# ==========================================

print("\n================================")
print("TEST RESULTS")
print("================================")

print(
    f"Test Accuracy: {accuracy:.4f}"
)

print(
    f"Test Recall: {recall:.4f}"
)

print(
    f"Test F1: {f1:.4f}"
)


# ==========================================
# 11. Confusion Matrix
# ==========================================

cm = confusion_matrix(
    all_labels,
    all_predictions
)


print("\nConfusion Matrix:")
print(cm)


# ==========================================
# 12. Classification Report
# ==========================================

print("\nClassification Report:")

print(
    classification_report(
        all_labels,
        all_predictions,
        target_names=[
            "Benign",
            "Malignant"
        ],
        zero_division=0
    )
)