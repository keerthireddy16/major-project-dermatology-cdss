
from pathlib import Path
import sys

import torch
import torch.nn as nn
from PIL import Image, UnidentifiedImageError
from torchvision import models, transforms

# Project paths
BASE_DIR = Path(__file__).resolve().parent
CHECKPOINT_PATH = BASE_DIR / "best_model.pth"
IMAGE_DIR = BASE_DIR / "ISIC-images"

# Match the preprocessing used during training
preprocess = transforms.Compose([
    transforms.Resize(
        (224, 224),
        interpolation=transforms.InterpolationMode.BILINEAR,
        antialias=True,
    ),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225],
    ),
])


def load_model():
    if not CHECKPOINT_PATH.is_file():
        raise FileNotFoundError(
            f"Checkpoint not found: {CHECKPOINT_PATH}"
        )

    model = models.efficientnet_b0(weights=None)
    model.classifier[1] = nn.Linear(1280, 2)

    state_dict = torch.load(
        CHECKPOINT_PATH,
        map_location="cpu",
        weights_only=True,
    )
    model.load_state_dict(state_dict)
    model.eval()
    return model


def choose_sample_image():
    extensions = {".jpg", ".jpeg", ".png", ".webp"}
    images = sorted(
        p for p in IMAGE_DIR.rglob("*")
        if p.is_file() and p.suffix.lower() in extensions
    ) if IMAGE_DIR.is_dir() else []

    if not images:
        raise FileNotFoundError(
            "No sample images found in ISIC-images. "
            "Pass an image path as a command-line argument."
        )

    return images[0]


def predict(image_path):
    image_path = Path(image_path)

    if not image_path.is_file():
        raise FileNotFoundError(f"Image not found: {image_path}")

    with Image.open(image_path) as opened_image:
        image = opened_image.convert("RGB")

    input_tensor = preprocess(image).unsqueeze(0)

    model = load_model()

    with torch.inference_mode():
        logits = model(input_tensor)
        probabilities = torch.softmax(logits, dim=1)[0]

    # Assumes training labels were encoded 0 = benign, 1 = malignant.
    class_names = ["Benign", "Malignant"]
    predicted_index = int(torch.argmax(probabilities).item())

    print("\n--- Skin Lesion Model Result ---")
    print(f"Image: {image_path.name}")
    print(f"Predicted class: {class_names[predicted_index]}")
    print(f"Model score: {probabilities[predicted_index].item() * 100:.2f}%")
    print("\nClass scores:")
    for index, name in enumerate(class_names):
        print(f"  {name}: {probabilities[index].item() * 100:.2f}%")

    print(
        "\nSafety note: This is an experimental model output, "
        "not a medical diagnosis. A benign prediction does not "
        "rule out skin cancer."
    )


if __name__ == "__main__":
    try:
        sample = Path(sys.argv[1]) if len(sys.argv) > 1 else choose_sample_image()
        predict(sample)
    except (FileNotFoundError, UnidentifiedImageError, OSError, RuntimeError) as error:
        print(f"ERROR: {error}")
        sys.exit(1)
