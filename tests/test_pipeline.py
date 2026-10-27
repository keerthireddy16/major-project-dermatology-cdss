import pytest
import torch
import numpy as np
from pathlib import Path
from PIL import Image

from app import get_model, PREPROCESS, compute_gradcam, CLASS_NAMES
from src.input_validation import validate_image
from src.image_quality import calculate_sharpness

BASE_DIR = Path(__file__).resolve().parent.parent
BENIGN_SAMPLE = BASE_DIR / "ISIC-images" / "ISIC_0024306.jpg"
MALIGNANT_SAMPLE = BASE_DIR / "ISIC-images" / "ISIC_0024310.jpg"


def test_label_names_alignment():
    """Verify class mapping has exactly 2 classes with Benign as 0 and Malignant as 1."""
    assert len(CLASS_NAMES) == 2
    assert CLASS_NAMES[0] == "Benign"
    assert CLASS_NAMES[1] == "Malignant"


def test_model_architecture_and_weights():
    """Verify cached model loads with correct shape and output dimension."""
    model = get_model()
    assert model.classifier[1].out_features == 2

    dummy_input = torch.randn(1, 3, 224, 224)
    with torch.inference_mode():
        output = model(dummy_input)
    assert output.shape == (1, 2)


def test_benign_prediction_end_to_end():
    """Verify prediction on benchmark sample ISIC_0024306.jpg produces Benign > 95%."""
    assert BENIGN_SAMPLE.exists(), f"Sample image {BENIGN_SAMPLE} not found"

    val_res = validate_image(BENIGN_SAMPLE)
    assert val_res["valid"] is True

    model = get_model()
    image = Image.open(BENIGN_SAMPLE).convert("RGB")
    tensor = PREPROCESS(image).unsqueeze(0)

    with torch.inference_mode():
        logits = model(tensor)
        probs = torch.softmax(logits, dim=1)[0]

    benign_score = probs[0].item() * 100
    assert benign_score > 95.0
    assert torch.argmax(probs).item() == 0


def test_malignant_prediction_end_to_end():
    """Verify prediction on benchmark sample ISIC_0024310.jpg produces Malignant > 70%."""
    assert MALIGNANT_SAMPLE.exists(), f"Sample image {MALIGNANT_SAMPLE} not found"

    val_res = validate_image(MALIGNANT_SAMPLE)
    assert val_res["valid"] is True

    model = get_model()
    image = Image.open(MALIGNANT_SAMPLE).convert("RGB")
    tensor = PREPROCESS(image).unsqueeze(0)

    with torch.inference_mode():
        logits = model(tensor)
        probs = torch.softmax(logits, dim=1)[0]

    malignant_score = probs[1].item() * 100
    assert malignant_score > 70.0
    assert torch.argmax(probs).item() == 1


def test_image_quality_sharpness():
    """Verify sharpness score calculation returns expected structure and valid score."""
    quality = calculate_sharpness(BENIGN_SAMPLE)
    assert "sharpness_score" in quality
    assert quality["sharpness_score"] > 0
    assert quality["quality_status"] == "REVIEW_REQUIRED"


def test_gradcam_generation():
    """Verify Grad-CAM produces a normalized 2D heatmap."""
    model = get_model()
    image = Image.open(BENIGN_SAMPLE).convert("RGB")
    tensor = PREPROCESS(image).unsqueeze(0)

    heatmap = compute_gradcam(model, tensor, target_class_idx=0)
    assert heatmap is not None
    assert isinstance(heatmap, np.ndarray)
    assert heatmap.ndim == 2
    assert heatmap.min() >= 0.0
    assert heatmap.max() <= 1.0


def test_input_validation_rejection(tmp_path: Path):
    """Verify corrupt/too small image is rejected."""
    tiny_img = tmp_path / "tiny.jpg"
    Image.new("RGB", (50, 50), color="blue").save(tiny_img)
    result = validate_image(tiny_img)
    assert result["valid"] is False
    assert "resolution is too small" in result["reason"].lower()
