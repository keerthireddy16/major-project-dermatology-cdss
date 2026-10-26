import pandas as pd
import torch
from torch.utils.data import Dataset, DataLoader
from torchvision import transforms
from torchvision.models import efficientnet_b0, EfficientNet_B0_Weights
from PIL import Image
from sklearn.metrics import accuracy_score, recall_score, f1_score
import torch.nn as nn
import torch.optim as optim


# ==========================================
# 1. Device
# ==========================================

device = torch.device(
    "cuda" if torch.cuda.is_available() else "cpu"
)

print("Using device:", device)


# ==========================================
# 2. Load datasets
# ==========================================

train_df = pd.read_csv("/content/train.csv")
val_df = pd.read_csv("/content/validation.csv")

print("Training images:", len(train_df))
print("Validation images:", len(val_df))


# ==========================================
# 3. Image transformations
# ==========================================

train_transform = transforms.Compose([

    transforms.Resize((224, 224)),

    transforms.RandomHorizontalFlip(),

    transforms.RandomVerticalFlip(),

    transforms.RandomRotation(15),

    transforms.ToTensor(),

    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    )
])


val_transform = transforms.Compose([

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

        # Get image path from CSV
        image_path = self.dataframe.loc[
            index,
            "image_path"
        ]

        # Convert Windows backslash path
        # to Linux/Colab slash path
        image_path = image_path.replace(
            "\\",
            "/"
        )

        # Add Colab content directory
        image_path = "/content/" + image_path

        # Get label
        label = self.dataframe.loc[
            index,
            "label"
        ]

        # Open image
        image = Image.open(
            image_path
        ).convert("RGB")

        # Apply transformations
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
# 5. Create datasets
# ==========================================

train_dataset = SkinLesionDataset(
    train_df,
    train_transform
)

val_dataset = SkinLesionDataset(
    val_df,
    val_transform
)


# ==========================================
# 6. Create DataLoaders
# ==========================================

train_loader = DataLoader(

    train_dataset,

    batch_size=16,

    shuffle=True,

    num_workers=0,

    pin_memory=True
)


val_loader = DataLoader(

    val_dataset,

    batch_size=16,

    shuffle=False,

    num_workers=0,

    pin_memory=True
)


# ==========================================
# 7. Load pretrained EfficientNet-B0
# ==========================================

print("\nLoading EfficientNet-B0...")

weights = EfficientNet_B0_Weights.DEFAULT

model = efficientnet_b0(
    weights=weights
)


# Replace final classification layer

model.classifier[1] = nn.Linear(

    model.classifier[1].in_features,

    2
)


# Move model to GPU

model = model.to(device)


print("Model loaded successfully.")


# ==========================================
# 8. Calculate class weights
# ==========================================

benign_count = (
    train_df["label"] == 0
).sum()


malignant_count = (
    train_df["label"] == 1
).sum()


total = (
    benign_count +
    malignant_count
)


weight_benign = (
    total /
    (2 * benign_count)
)


weight_malignant = (
    total /
    (2 * malignant_count)
)


class_weights = torch.tensor(

    [
        weight_benign,
        weight_malignant
    ],

    dtype=torch.float32

).to(device)


print("\nClass weights:")

print(
    "Benign:",
    weight_benign
)

print(
    "Malignant:",
    weight_malignant
)


# ==========================================
# 9. Loss function
# ==========================================

criterion = nn.CrossEntropyLoss(

    weight=class_weights
)


# ==========================================
# 10. Optimizer
# ==========================================

optimizer = optim.AdamW(

    model.parameters(),

    lr=0.0001
)


# ==========================================
# 11. Training settings
# ==========================================

epochs = 5

best_f1 = 0.0


# ==========================================
# 12. Training loop
# ==========================================

for epoch in range(epochs):

    print("\n================================")

    print(
        "Epoch",
        epoch + 1,
        "/",
        epochs
    )

    print("================================")


    # ======================================
    # Training
    # ======================================

    model.train()

    train_loss = 0.0


    for images, labels in train_loader:

        # Move images to GPU
        images = images.to(
            device,
            non_blocking=True
        )

        # Move labels to GPU
        labels = labels.to(
            device,
            non_blocking=True
        )


        # Clear previous gradients
        optimizer.zero_grad()


        # Forward pass
        outputs = model(images)


        # Calculate loss
        loss = criterion(
            outputs,
            labels
        )


        # Backpropagation
        loss.backward()


        # Update model weights
        optimizer.step()


        # Add loss
        train_loss += loss.item()


    # Average training loss

    train_loss = (
        train_loss /
        len(train_loader)
    )


    # ======================================
    # Validation
    # ======================================

    model.eval()

    val_loss = 0.0


    all_predictions = []

    all_labels = []


    with torch.no_grad():

        for images, labels in val_loader:

            # Move images to GPU
            images = images.to(
                device,
                non_blocking=True
            )

            # Move labels to GPU
            labels = labels.to(
                device,
                non_blocking=True
            )


            # Forward pass
            outputs = model(images)


            # Calculate validation loss
            loss = criterion(
                outputs,
                labels
            )


            val_loss += loss.item()


            # Get predicted class
            predictions = torch.argmax(

                outputs,

                dim=1
            )


            # Store predictions
            all_predictions.extend(

                predictions
                .cpu()
                .numpy()
            )


            # Store actual labels
            all_labels.extend(

                labels
                .cpu()
                .numpy()
            )


    # Average validation loss

    val_loss = (
        val_loss /
        len(val_loader)
    )


    # ======================================
    # Calculate metrics
    # ======================================

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


    # ======================================
    # Print results
    # ======================================

    print(
        f"Train Loss: {train_loss:.4f}"
    )


    print(
        f"Validation Loss: {val_loss:.4f}"
    )


    print(
        f"Validation Accuracy: {accuracy:.4f}"
    )


    print(
        f"Validation Recall: {recall:.4f}"
    )


    print(
        f"Validation F1: {f1:.4f}"
    )


    # ======================================
    # Save best model
    # ======================================

    if f1 > best_f1:

        best_f1 = f1


        torch.save(

            model.state_dict(),

            "/content/best_model.pth"
        )


        print(
            "Best model saved!"
        )


# ==========================================
# 13. Training complete
# ==========================================

print("\n================================")

print("Training complete.")

print("================================")


print(
    "Best validation F1:",
    best_f1
)