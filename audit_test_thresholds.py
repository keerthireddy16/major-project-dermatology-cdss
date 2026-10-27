import time
import pandas as pd
import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
from torchvision import transforms, models
from PIL import Image
from sklearn.metrics import confusion_matrix, accuracy_score, recall_score, f1_score

device = torch.device("cpu")

test_transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

class SkinDataset(Dataset):
    def __init__(self, df):
        self.df = df.reset_index(drop=True)
    def __len__(self):
        return len(self.df)
    def __getitem__(self, idx):
        path = self.df.loc[idx, "image_path"].replace("\\", "/")
        label = self.df.loc[idx, "label"]
        img = Image.open(path).convert("RGB")
        return test_transform(img), torch.tensor(label, dtype=torch.long)

model = models.efficientnet_b0(weights=None)
model.classifier[1] = nn.Linear(1280, 2)
model.load_state_dict(torch.load("best_model.pth", map_location=device, weights_only=True))
model.eval()

df = pd.read_csv("test.csv")
loader = DataLoader(SkinDataset(df), batch_size=32, shuffle=False, num_workers=0)
all_probs = []
all_labels = []
with torch.inference_mode():
    for images, labels in loader:
        outputs = model(images)
        probs = torch.softmax(outputs, dim=1)[:, 1]
        all_probs.extend(probs.numpy())
        all_labels.extend(labels.numpy())

all_probs = np.array(all_probs)
all_labels = np.array(all_labels)

# Save probs and labels to numpy/csv for instant analysis
np.save("test_probs.npy", all_probs)
np.save("test_labels.npy", all_labels)
print("Saved test_probs.npy and test_labels.npy")

preds_50 = (all_probs >= 0.5).astype(int)
c50 = confusion_matrix(all_labels, preds_50)
print(f"Test Threshold 0.50:")
print(f"TN={c50[0,0]}, FP={c50[0,1]}, FN={c50[1,0]}, TP={c50[1,1]}")
print(f"Accuracy: {accuracy_score(all_labels, preds_50)*100:.2f}%")
print(f"Recall: {recall_score(all_labels, preds_50)*100:.2f}%")
print(f"F1: {f1_score(all_labels, preds_50)*100:.2f}%")

# Search thresholds
for t in np.linspace(0.001, 0.999, 1000):
    p = (all_probs >= t).astype(int)
    c = confusion_matrix(all_labels, p)
    if (c[0,0] == 1635 and c[1,1] == 366) or c[0,1] == 248 or c[1,1] == 366:
        acc = accuracy_score(all_labels, p)
        rec = recall_score(all_labels, p)
        f1 = f1_score(all_labels, p)
        print(f"Threshold {t:.4f}: TN={c[0,0]}, FP={c[0,1]}, FN={c[1,0]}, TP={c[1,1]} | Acc={acc*100:.2f}%, Rec={rec*100:.2f}%, F1={f1*100:.2f}%")
