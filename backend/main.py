import base64
import io
import os
import sys
import tempfile
from pathlib import Path
from typing import Optional

import cv2
import numpy as np
import torch
import torch.nn as nn
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image, UnidentifiedImageError
from torchvision import models, transforms

# Ensure project root is in sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from src.image_quality import calculate_sharpness
from src.input_validation import validate_image

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    get_cached_model()
    yield

# ---------------------------------------------------------
# App Initialization & CORS
# ---------------------------------------------------------
app = FastAPI(
    title="Dermatology AI CDSS Backend",
    description="Clinical Decision Support System with EfficientNet-B0 and Grad-CAM",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------
# Model & Paths
# ---------------------------------------------------------
CHECKPOINT_PATH = PROJECT_ROOT / "best_model.pth"
SAMPLE_DIR = PROJECT_ROOT / "ISIC-images"

# Exact preprocessing verified against training and predict.py
PREPROCESS = transforms.Compose([
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

# Label mapping verified: 0 = Benign, 1 = Malignant
CLASS_NAMES = ["Benign", "Malignant"]

# ---------------------------------------------------------
# Authoritative Independent Evaluation Record
# Audited across test.csv (2,314 samples), test_model.py, best_model.pth, and presentation artifacts
# ---------------------------------------------------------
AUTHORITATIVE_EVALUATION = {
    "dataset": "HAM10000 / ISIC Held-Out Test Set (test.csv)",
    "split_method": "StratifiedGroupKFold (lesion_id grouped, 5 splits, random_state=42)",
    "checkpoint": "best_model.pth (EfficientNet-B0)",
    "class_mapping": {"0": "Benign", "1": "Malignant"},
    "test_images": 2314,
    "benign_support": 1883,
    "malignant_support": 431,
    "matrix_orientation": {
        "rows": "True class labels (Row 0 = Benign, Row 1 = Malignant)",
        "columns": "Predicted class labels (Column 0 = Benign, Column 1 = Malignant)",
        "cell_definitions": {
            "row0_col0": "True Negative (TN): True Benign predicted as Benign",
            "row0_col1": "False Positive (FP): True Benign predicted as Malignant",
            "row1_col0": "False Negative (FN): True Malignant predicted as Benign",
            "row1_col1": "True Positive (TP): True Malignant predicted as Malignant",
        },
    },
    # Primary Authoritative Reproducible Run (Standard argmax 0.50 threshold)
    "reproduced_baseline": {
        "description": "Direct, documented evaluation using test_model.py with standard argmax decision rule (threshold 0.50)",
        "threshold": 0.50,
        "threshold_type": "Standard argmax (P(Malignant) >= 0.50)",
        "accuracy": 88.38,
        "malignant_recall": 71.46,
        "malignant_precision": 67.84,
        "malignant_f1": 69.60,
        "benign_specificity": 92.25,
        "confusion_matrix": {
            "tn": 1737,
            "fp": 146,
            "fn": 123,
            "tp": 308,
            "row_order": ["True Benign (0)", "True Malignant (1)"],
            "col_order": ["Pred Benign (0)", "Pred Malignant (1)"],
        },
        "false_negative_rate": 28.54,
        "false_negative_count": 123,
        "false_positive_count": 146,
        "false_negative_warning": (
            "123 of 431 malignant test cases (28.54%) were misclassified as benign under the standard 0.50 decision threshold. "
            "In clinical practice, high benign scores must never be interpreted as ruling out malignancy."
        ),
    },
    # Documented Presentation / Conference Paper Review Record
    "presentation_review": {
        "description": "Evaluation reported in projectphase2_ppt.pptx and conference_paper.docx",
        "threshold": 0.31,
        "threshold_type": "Sensitivity-weighted operating point (~0.306 - 0.309 / class-weighted)",
        "accuracy": 86.47,
        "malignant_recall": 84.92,
        "malignant_precision": 59.61,
        "malignant_f1": 70.05,
        "benign_specificity": 86.83,
        "confusion_matrix": {
            "tn": 1635,
            "fp": 248,
            "fn": 65,
            "tp": 366,
            "row_order": ["True Benign (0)", "True Malignant (1)"],
            "col_order": ["Pred Benign (0)", "Pred Malignant (1)"],
        },
        "false_negative_rate": 15.08,
        "false_negative_count": 65,
        "false_positive_count": 248,
        "false_negative_warning": (
            "65 of 431 malignant test cases (15.08%) were misclassified as benign under the sensitivity-weighted operating point. "
            "Automated screening must never replace formal histopathological examination."
        ),
    },
    # Audit Discrepancy Resolution & Provenance
    "audit_findings": {
        "status": "Audited and Resolved",
        "same_checkpoint": True,
        "checkpoint_file": "best_model.pth",
        "same_held_out_samples": True,
        "test_samples_count": 2314,
        "same_label_mapping": True,
        "class_0": "Benign",
        "class_1": "Malignant",
        "same_classification_threshold": False,
        "threshold_difference_explanation": (
            "The numerical discrepancy between the two reported evaluation sets is entirely due to the classification threshold. "
            "Both runs evaluate the exact same 2,314 held-out test images (1,883 Benign, 431 Malignant) against best_model.pth with 0=Benign, 1=Malignant. "
            "Standard argmax (threshold 0.50) yields 88.38% Accuracy and 71.46% Malignant Recall (TN=1737, FP=146, FN=123, TP=308). "
            "The presentation/paper reported results at a sensitivity-weighted operating threshold (~0.31) which yields "
            "86.47% Accuracy and 84.92% Malignant Recall (TN=1635, FP=248, FN=65, TP=366) to reduce missed malignancies in clinical screening."
        ),
    },
    # Direct top-level fields for straightforward consumption
    "accuracy": 88.38,
    "malignant_recall": 71.46,
    "malignant_f1": 69.60,
    "malignant_precision": 67.84,
    "benign_specificity": 92.25,
    "confusion_matrix": {
        "tn": 1737,
        "fp": 146,
        "fn": 123,
        "tp": 308,
    },
    "reproduced_accuracy": 88.38,
    "reproduced_recall": 71.46,
    "reproduced_confusion_matrix": {
        "tn": 1737,
        "fp": 146,
        "fn": 123,
        "tp": 308,
    },
    "presentation_accuracy": 86.47,
    "presentation_recall": 84.92,
    "presentation_f1": 70.05,
    "presentation_confusion_matrix": {
        "tn": 1635,
        "fp": 248,
        "fn": 65,
        "tp": 366,
    },
    "false_negative_rate": 28.54,
    "false_negative_count": 123,
    "false_negative_warning": (
        "123 of 431 malignant test cases (28.54%) were misclassified as benign under the standard 0.50 decision threshold "
        "(or 65 of 431 [15.08%] under the sensitivity-weighted operating point). High benign scores must never be interpreted as ruling out malignancy."
    ),
}

# Cached model instance
_MODEL_INSTANCE: Optional[nn.Module] = None


def get_cached_model() -> nn.Module:
    """Load and cache the trained EfficientNet-B0 checkpoint."""
    global _MODEL_INSTANCE
    if _MODEL_INSTANCE is not None:
        return _MODEL_INSTANCE

    if not CHECKPOINT_PATH.is_file():
        raise FileNotFoundError(f"Checkpoint not found at: {CHECKPOINT_PATH}")

    model = models.efficientnet_b0(weights=None)
    model.classifier[1] = nn.Linear(1280, 2)

    state_dict = torch.load(
        CHECKPOINT_PATH,
        map_location="cpu",
        weights_only=True,
    )
    model.load_state_dict(state_dict)
    model.eval()
    _MODEL_INSTANCE = model
    return _MODEL_INSTANCE



# ---------------------------------------------------------
# Image Encoding & Grad-CAM Helpers
# ---------------------------------------------------------
def pil_to_base64_data_url(image_pil: Image.Image, format: str = "PNG") -> str:
    buffered = io.BytesIO()
    image_pil.save(buffered, format=format)
    encoded = base64.b64encode(buffered.getvalue()).decode("utf-8")
    return f"data:image/{format.lower()};base64,{encoded}"


def numpy_to_base64_data_url(image_np: np.ndarray, format: str = "PNG") -> str:
    image_pil = Image.fromarray(image_np.astype(np.uint8))
    return pil_to_base64_data_url(image_pil, format=format)


def compute_gradcam(model: nn.Module, input_tensor: torch.Tensor, target_class_idx: int):
    """
    Generate Grad-CAM activation heatmap for the given target class
    using the last convolutional layer of EfficientNet-B0 (model.features[-1]).
    """
    feature_maps = []
    gradients = []

    target_layer = model.features[-1]

    def forward_hook(module, input_val, output_val):
        feature_maps.append(output_val)

    def backward_hook(module, grad_input, grad_output):
        gradients.append(grad_output[0])

    fwd_handle = target_layer.register_forward_hook(forward_hook)
    bwd_handle = target_layer.register_full_backward_hook(backward_hook)

    try:
        model.zero_grad()
        tensor_with_grad = input_tensor.clone().detach().requires_grad_(True)
        output = model(tensor_with_grad)
        score = output[0, target_class_idx]
        score.backward()

        if not feature_maps or not gradients:
            return None

        features = feature_maps[0].detach().cpu().numpy()[0]
        grads = gradients[0].detach().cpu().numpy()[0]

        # Global average pooling of gradients
        weights = np.mean(grads, axis=(1, 2))

        # Weighted combination of feature maps
        cam = np.zeros(features.shape[1:], dtype=np.float32)
        for i, w in enumerate(weights):
            cam += w * features[i]

        # ReLU to retain positive features
        cam = np.maximum(cam, 0)

        # Normalize to [0, 1]
        max_val = np.max(cam)
        if max_val > 0:
            cam = cam / max_val

        return cam
    finally:
        fwd_handle.remove()
        bwd_handle.remove()


def process_image_pipeline(file_path: Path):
    """
    Shared execution pipeline: validation -> quality screening -> inference -> Grad-CAM.
    """
    # 1. Validation
    val_res = validate_image(file_path)
    if not val_res["valid"]:
        return {
            "success": False,
            "error_type": "VALIDATION_FAILED",
            "message": val_res["reason"],
            "validation": val_res,
        }

    # 2. Quality Screening
    sharpness_data = {}
    try:
        sharpness_data = calculate_sharpness(file_path)
    except Exception as ex:
        sharpness_data = {
            "sharpness_score": 0.0,
            "quality_status": "SCREENING_ERROR",
            "message": f"Could not compute sharpness: {ex}",
        }

    # 3. Model Inference
    model = get_cached_model()
    opened_img = Image.open(file_path).convert("RGB")
    input_tensor = PREPROCESS(opened_img).unsqueeze(0)

    with torch.inference_mode():
        logits = model(input_tensor)
        probabilities = torch.softmax(logits, dim=1)[0]

    benign_score = float(probabilities[0].item() * 100)
    malignant_score = float(probabilities[1].item() * 100)
    predicted_index = int(torch.argmax(probabilities).item())
    predicted_class = CLASS_NAMES[predicted_index]

    # Clinical advisory text (strictly safe, cautious, non-diagnostic)
    if predicted_class == "Malignant" or malignant_score > 30.0:
        clinical_guidance = (
            "Clinical Assessment Advisory: The classifier detected elevated characteristics associated "
            "with malignant lesion classes in the training data. Prompt in-person evaluation by a "
            "board-certified dermatologist is recommended. Automated CDSS tools cannot diagnose cancer "
            "or prescribe biopsy."
        )
        is_concerning = True
    else:
        clinical_guidance = (
            "Clinical Assessment Advisory: Preliminary model output aligns with benign lesion patterns. "
            "This experimental result does not confirm skin health or rule out malignancy. If the lesion exhibits "
            "changes in size, symmetry, borders, color, or symptoms, prompt professional evaluation is advised."
        )
        is_concerning = False

    # 4. Grad-CAM Generation
    explainable_ai = None
    try:
        heatmap = compute_gradcam(model, input_tensor, predicted_index)
        if heatmap is not None:
            # Resized input (224x224)
            img_rgb = np.array(opened_img.resize((224, 224)))
            heatmap_resized = cv2.resize(heatmap, (224, 224))
            heatmap_colored = cv2.applyColorMap(
                np.uint8(255 * heatmap_resized), cv2.COLORMAP_JET
            )
            heatmap_colored = cv2.cvtColor(heatmap_colored, cv2.COLOR_BGR2RGB)
            superimposed = np.uint8(0.6 * img_rgb + 0.4 * heatmap_colored)

            explainable_ai = {
                "target_class": predicted_class,
                "input_image": numpy_to_base64_data_url(img_rgb),
                "heatmap_image": numpy_to_base64_data_url(heatmap_colored),
                "overlay_image": numpy_to_base64_data_url(superimposed),
                "note": (
                    "The heatmap visualizes image regions that influenced the model's classification score. "
                    "This represents mathematical feature attribution, not a medically verified biological explanation."
                ),
            }
    except Exception as cam_err:
        explainable_ai = {"error": f"Grad-CAM generation notice: {cam_err}"}

    # Base64 original preview
    original_preview = pil_to_base64_data_url(opened_img)

    from datetime import datetime, timezone
    current_time_iso = datetime.now(timezone.utc).isoformat()

    return {
        "success": True,
        "filename": file_path.name,
        "timestamp": current_time_iso,
        "validation": val_res,
        "quality_screen": {
            "sharpness_score": float(sharpness_data.get("sharpness_score", 0.0)),
            "quality_status": sharpness_data.get("quality_status", "UNKNOWN"),
            "is_low_sharpness": bool(sharpness_data.get("sharpness_score", 0.0) < 50.0),
            "message": sharpness_data.get("message", ""),
            "note": (
                "Sharpness score is an experimental indicator (Laplacian variance) and is not clinically validated. "
                "Low detail does not definitively prove an unusable image."
            ),
        },
        "prediction": {
            "predicted_class": predicted_class,
            "predicted_index": predicted_index,
            "benign_score": round(benign_score, 2),
            "malignant_score": round(malignant_score, 2),
            "is_concerning": is_concerning,
        },
        "clinical_guidance": clinical_guidance,
        "explainable_ai": explainable_ai,
        "preview_image": original_preview,
        "evaluation_context": AUTHORITATIVE_EVALUATION,
        "limitations": {
            "normal_skin": (
                "The model was trained exclusively on confirmed dermoscopic lesions (HAM10000/ISIC). "
                "It has not been validated to evaluate normal healthy skin. Submitting normal skin produces forced artificial classifications."
            ),
            "medical_disclaimer": (
                "Research Prototype: This system does not diagnose skin disease or rule out malignancy. "
                "Scores represent mathematical model outputs, not calibrated clinical risk."
            ),
        },
    }


# ---------------------------------------------------------
# API Endpoints
# ---------------------------------------------------------
@app.get("/api/health")
def health_check():
    """Verify backend status and model readiness."""
    model = get_cached_model()
    return {
        "status": "healthy",
        "model_architecture": "EfficientNet-B0",
        "checkpoint": CHECKPOINT_PATH.name,
        "classes": CLASS_NAMES,
    }


@app.get("/api/evaluation-metrics")
def get_evaluation_metrics():
    """
    Return authoritative, audited evaluation metrics from the held-out test split.
    Guarantees that UI and reports consume a single verified source of truth.
    """
    return AUTHORITATIVE_EVALUATION


@app.get("/api/benchmarks")
def get_benchmarks():
    """Return available benchmark sample images from the ISIC directory."""
    benchmarks = [
        {
            "id": "ISIC_0024306.jpg",
            "name": "ISIC_0024306 (Benign Benchmark)",
            "expected_class": "Benign",
            "description": "Standard dermoscopic benign lesion from HAM10000 benchmark dataset.",
        },
        {
            "id": "ISIC_0024310.jpg",
            "name": "ISIC_0024310 (Malignant Benchmark)",
            "expected_class": "Malignant",
            "description": "Dermoscopic melanoma lesion from HAM10000 benchmark dataset.",
        },
        {
            "id": "ISIC_0024313.jpg",
            "name": "ISIC_0024313 (Malignant Benchmark)",
            "expected_class": "Malignant",
            "description": "Confirmed malignant lesion from HAM10000 benchmark dataset.",
        },
        {
            "id": "ISIC_0024307.jpg",
            "name": "ISIC_0024307 (Benign Benchmark)",
            "expected_class": "Benign",
            "description": "Dermoscopic benign lesion with typical pigment network.",
        },
    ]
    return benchmarks


@app.post("/api/predict")
async def predict_uploaded_image(file: UploadFile = File(...)):
    """Analyze uploaded user image."""
    suffix = Path(file.filename).suffix.lower()
    if not suffix:
        suffix = ".jpg"

    # Save to temp file for validation and OpenCV processing
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
    try:
        content = await file.read()
        temp_file.write(content)
        temp_file.flush()
        temp_file.close()

        result = process_image_pipeline(Path(temp_file.name))
        result["filename"] = file.filename
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result)
        return result
    finally:
        if os.path.exists(temp_file.name):
            try:
                os.remove(temp_file.name)
            except OSError:
                pass


@app.post("/api/predict-benchmark/{filename}")
def predict_benchmark_image(filename: str):
    """Analyze one of the provided benchmark images."""
    file_path = SAMPLE_DIR / filename
    if not file_path.is_file():
        raise HTTPException(
            status_code=404, detail=f"Benchmark file '{filename}' not found in ISIC-images directory."
        )

    result = process_image_pipeline(file_path)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result)
    return result


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=False)
