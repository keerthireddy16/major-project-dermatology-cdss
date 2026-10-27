import io
from pathlib import Path
import pytest
from PIL import Image
from fastapi.testclient import TestClient

from backend.main import app

client = TestClient(app)
BASE_DIR = Path(__file__).resolve().parent.parent
BENIGN_SAMPLE = BASE_DIR / "ISIC-images" / "ISIC_0024306.jpg"


def test_health_check_endpoint():
    """Verify GET /api/health returns healthy status and correct architecture."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["model_architecture"] == "EfficientNet-B0"
    assert data["classes"] == ["Benign", "Malignant"]


def test_benchmarks_list_endpoint():
    """Verify GET /api/benchmarks returns the benchmark samples."""
    response = client.get("/api/benchmarks")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 2
    ids = [item["id"] for item in data]
    assert "ISIC_0024306.jpg" in ids
    assert "ISIC_0024310.jpg" in ids


def test_predict_benchmark_benign():
    """Verify POST /api/predict-benchmark with benign sample produces Benign > 95%."""
    response = client.post("/api/predict-benchmark/ISIC_0024306.jpg")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["prediction"]["predicted_class"] == "Benign"
    assert data["prediction"]["benign_score"] > 95.0
    assert "explainable_ai" in data
    assert data["explainable_ai"]["input_image"].startswith("data:image/png;base64,")
    assert data["explainable_ai"]["heatmap_image"].startswith("data:image/png;base64,")
    assert data["explainable_ai"]["overlay_image"].startswith("data:image/png;base64,")


def test_predict_benchmark_malignant():
    """Verify POST /api/predict-benchmark with malignant sample produces Malignant > 70%."""
    response = client.post("/api/predict-benchmark/ISIC_0024310.jpg")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["prediction"]["predicted_class"] == "Malignant"
    assert data["prediction"]["malignant_score"] > 70.0
    assert data["prediction"]["is_concerning"] is True


def test_predict_benchmark_missing_file():
    """Verify POST /api/predict-benchmark with non-existent filename returns 404."""
    response = client.post("/api/predict-benchmark/non_existent_image_12345.jpg")
    assert response.status_code == 404


def test_predict_upload_valid_image():
    """Verify POST /api/predict with valid uploaded JPEG file succeeds."""
    with open(BENIGN_SAMPLE, "rb") as f:
        file_bytes = f.read()

    files = {"file": ("test_lesion.jpg", file_bytes, "image/jpeg")}
    response = client.post("/api/predict", files=files)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["prediction"]["predicted_class"] == "Benign"
    assert data["quality_screen"]["quality_status"] == "REVIEW_REQUIRED"


def test_predict_upload_unsupported_extension():
    """Verify POST /api/predict with unsupported extension (e.g. .txt) is rejected with 400."""
    fake_content = b"Not an image file"
    files = {"file": ("report.txt", fake_content, "text/plain")}
    response = client.post("/api/predict", files=files)
    assert response.status_code == 400
    data = response.json()
    assert "Unsupported file extension" in data["detail"]["message"]


def test_predict_upload_corrupt_image():
    """Verify POST /api/predict with corrupt file masked as .jpg is rejected with 400."""
    corrupt_bytes = b"\xFF\xD8\xFF\xE0\x00\x10JFIF\x00garbage_corrupt_data"
    files = {"file": ("corrupt.jpg", corrupt_bytes, "image/jpeg")}
    response = client.post("/api/predict", files=files)
    assert response.status_code == 400
    data = response.json()
    assert "corrupted" in data["detail"]["message"].lower() or "decoded" in data["detail"]["message"].lower()


def test_predict_upload_undersized_image():
    """Verify POST /api/predict with image resolution smaller than 100x100 is rejected with 400."""
    buf = io.BytesIO()
    Image.new("RGB", (60, 60), color="red").save(buf, format="JPEG")
    buf.seek(0)

    files = {"file": ("too_small.jpg", buf.getvalue(), "image/jpeg")}
    response = client.post("/api/predict", files=files)
    assert response.status_code == 400
    data = response.json()
    assert "resolution is too small" in data["detail"]["message"].lower()


def test_scientific_disclaimers_and_cautious_language():
    """Verify response does not claim medical diagnosis or ruling out cancer."""
    response = client.post("/api/predict-benchmark/ISIC_0024306.jpg")
    data = response.json()

    # Benign text should explicitly NOT claim to rule out malignancy
    guidance = data["clinical_guidance"].lower()
    assert "does not confirm skin health or rule out malignancy" in guidance

    # Quality note should state experimental nature
    quality_note = data["quality_screen"]["note"].lower()
    assert "experimental" in quality_note
    assert "not clinically validated" in quality_note

    # Normal skin boundary limitation should be explicit
    assert "normal_skin" in data["limitations"]
    assert "not been validated" in data["limitations"]["normal_skin"].lower()


def test_evaluation_context_and_timestamp_present():
    """Verify response includes timestamp and verified authoritative evaluation context."""
    response = client.post("/api/predict-benchmark/ISIC_0024306.jpg")
    assert response.status_code == 200
    data = response.json()
    assert "timestamp" in data
    assert "evaluation_context" in data
    eval_ctx = data["evaluation_context"]
    assert eval_ctx["test_images"] == 2314
    assert eval_ctx["accuracy"] == 88.38
    assert eval_ctx["malignant_recall"] == 71.46
    assert eval_ctx["confusion_matrix"]["fn"] == 123
    assert eval_ctx["reproduced_baseline"]["accuracy"] == 88.38
    assert eval_ctx["presentation_review"]["accuracy"] == 86.47


def test_authoritative_evaluation_endpoint():
    """Verify GET /api/evaluation-metrics returns authoritative evaluation record with provenance."""
    response = client.get("/api/evaluation-metrics")
    assert response.status_code == 200
    metrics = response.json()

    assert metrics["test_images"] == 2314
    assert metrics["benign_support"] == 1883
    assert metrics["malignant_support"] == 431
    assert metrics["checkpoint"] == "best_model.pth (EfficientNet-B0)"
    assert metrics["class_mapping"] == {"0": "Benign", "1": "Malignant"}
    assert "audit_findings" in metrics
    assert metrics["audit_findings"]["status"] == "Audited and Resolved"
    assert metrics["audit_findings"]["same_checkpoint"] is True
    assert metrics["audit_findings"]["same_held_out_samples"] is True


def test_confusion_matrix_and_metrics_internal_consistency():
    """
    Test mathematical consistency of confusion matrices and derived metrics:
    1. Sample counts (TN + FP == 1883, FN + TP == 431, Total == 2314).
    2. Accuracy formula: (TN + TP) / Total.
    3. Recall (Sensitivity) formula: TP / (TP + FN).
    4. Precision formula: TP / (TP + FP).
    5. F1-score formula: 2 * (Precision * Recall) / (Precision + Recall).
    6. Specificity formula: TN / (TN + FP).
    7. False-negative rate: FN / (TP + FN).
    8. Matrix orientation: rows=True [0: Benign, 1: Malignant], cols=Pred [0: Benign, 1: Malignant].
    """
    response = client.get("/api/evaluation-metrics")
    assert response.status_code == 200
    data = response.json()

    # 1. Check Primary Authoritative Reproducible Run (Standard argmax 0.50 threshold)
    rep = data["reproduced_baseline"]
    cm_rep = rep["confusion_matrix"]
    tn, fp, fn, tp = cm_rep["tn"], cm_rep["fp"], cm_rep["fn"], cm_rep["tp"]

    # Sample counts
    assert tn + fp == 1883, f"True Benign must equal 1883, got {tn + fp}"
    assert fn + tp == 431, f"True Malignant must equal 431, got {fn + tp}"
    assert tn + fp + fn + tp == 2314, f"Total test samples must equal 2314, got {tn + fp + fn + tp}"

    # Accuracy
    calc_acc = round((tn + tp) / 2314 * 100, 2)
    assert calc_acc == rep["accuracy"] == 88.38

    # Recall (Sensitivity)
    calc_rec = round(tp / (tp + fn) * 100, 2)
    assert calc_rec == rep["malignant_recall"] == 71.46

    # Precision
    calc_prec = round(tp / (tp + fp) * 100, 2)
    assert calc_prec == rep["malignant_precision"] == 67.84

    # F1-Score
    prec_ratio = tp / (tp + fp)
    rec_ratio = tp / (tp + fn)
    calc_f1 = round(2 * (prec_ratio * rec_ratio) / (prec_ratio + rec_ratio) * 100, 2)
    assert calc_f1 == rep["malignant_f1"] == 69.60

    # Specificity
    calc_spec = round(tn / (tn + fp) * 100, 2)
    assert calc_spec == rep["benign_specificity"] == 92.25

    # False Negative Rate
    calc_fnr = round(fn / (tp + fn) * 100, 2)
    assert calc_fnr == rep["false_negative_rate"] == 28.54

    # 2. Check Documented Presentation Review Run (Sensitivity-weighted operating threshold ~0.31)
    pres = data["presentation_review"]
    cm_pres = pres["confusion_matrix"]
    p_tn, p_fp, p_fn, p_tp = cm_pres["tn"], cm_pres["fp"], cm_pres["fn"], cm_pres["tp"]

    # Sample counts
    assert p_tn + p_fp == 1883, f"Presentation True Benign must equal 1883, got {p_tn + p_fp}"
    assert p_fn + p_tp == 431, f"Presentation True Malignant must equal 431, got {p_fn + p_tp}"
    assert p_tn + p_fp + p_fn + p_tp == 2314, f"Presentation total must equal 2314, got {p_tn + p_fp + p_fn + p_tp}"

    # Accuracy
    calc_pres_acc = round((p_tn + p_tp) / 2314 * 100, 2)
    assert calc_pres_acc == pres["accuracy"] == 86.47

    # Recall (Sensitivity)
    calc_pres_rec = round(p_tp / (p_tp + p_fn) * 100, 2)
    assert calc_pres_rec == pres["malignant_recall"] == 84.92

    # Precision
    calc_pres_prec = round(p_tp / (p_tp + p_fp) * 100, 2)
    assert calc_pres_prec == pres["malignant_precision"] == 59.61

    # F1-Score
    p_prec_ratio = p_tp / (p_tp + p_fp)
    p_rec_ratio = p_tp / (p_tp + p_fn)
    calc_pres_f1 = round(2 * (p_prec_ratio * p_rec_ratio) / (p_prec_ratio + p_rec_ratio) * 100, 2)
    assert calc_pres_f1 == pres["malignant_f1"] == 70.05

    # Specificity
    calc_pres_spec = round(p_tn / (p_tn + p_fp) * 100, 2)
    assert calc_pres_spec == pres["benign_specificity"] == 86.83

    # False Negative Rate
    calc_pres_fnr = round(p_fn / (p_tp + p_fn) * 100, 2)
    assert calc_pres_fnr == pres["false_negative_rate"] == 15.08

