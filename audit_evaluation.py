import time
import pandas as pd
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
from torchvision import transforms, models
from PIL import Image
from sklearn.metrics import (
    accuracy_score,
    recall_score,
    f1_score,
    confusion_matrix,
    classification_report
)

device = torch.device("cpu")
print("Evaluating on device:", device)

test_df = pd.read_csv("test.csv")
print("Total test images in test.csv:", len(test_df))

test_transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    )
])

class SkinLesionDataset(Dataset):
    def __init__(self, dataframe, transform=None):
        self.dataframe = dataframe.reset_index(drop=True)
        self.transform = transform

    def __len__(self):
        return len(self.dataframe)

    def __getitem__(self, index):
        image_path = self.dataframe.loc[index, "image_path"]
        image_path = image_path.replace("\\", "/")
        label = self.dataframe.loc[index, "label"]
        image = Image.open(image_path).convert("RGB")
        if self.transform:
            image = self.transform(image)
        return image, torch.tensor(label, dtype=torch.long)

test_dataset = SkinLesionDataset(test_df, test_transform)
test_loader = DataLoader(
    test_dataset,
    batch_size=32,
    shuffle=False,
    num_workers=0
)

model = models.efficientnet_b0(weights=None)
model.classifier[1] = nn.Linear(1280, 2)
model.load_state_dict(torch.load("best_model.pth", map_location=device, weights_only=True))
model.eval()
print("Model loaded successfully.")

all_predictions = []
all_labels = []

t0 = time.time()
with torch.inference_mode():
    for i, (images, labels) in enumerate(test_loader):
        outputs = model(images)
        preds = torch.argmax(outputs, dim=1)
        all_predictions.extend(preds.numpy())
        all_labels.extend(labels.numpy())
        if (i + 1) % 15 == 0 or (i + 1) == len(test_loader):
            print(f"Processed batch {i + 1}/{len(test_loader)} ({len(all_predictions)} images) in {time.time() - t0:.1f}s")

accuracy = accuracy_score(all_labels, all_predictions)
recall = recall_score(all_labels, all_predictions, zero_division=0)
f1 = f1_score(all_labels, all_predictions, zero_division=0)
cm = confusion_matrix(all_labels, all_predictions)

print("\n================================")
print("AUDIT EVALUATION RESULTS")
print("================================")
print(f"Test Accuracy: {accuracy:.4f} ({accuracy * 100:.2f}%)")
print(f"Test Recall (Malignant, pos_label=1): {recall:.4f} ({recall * 100:.2f}%)")
print(f"Test F1 (Malignant, pos_label=1): {f1:.4f} ({f1 * 100:.2f}%)")
print("\nConfusion Matrix (rows=True [0,1], cols=Pred [0,1]):")
print(cm)
print(f"TN={cm[0,0]}, FP={cm[0,1]}, FN={cm[1,0]}, TP={cm[1,1]}")

print("\nClassification Report:")
print(classification_report(all_labels, all_predictions, target_names=["Benign", "Malignant"], zero_division=0))
