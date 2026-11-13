# DermAI — AI-Based Clinical Decision Support System for Dermatological Diseases

DermAI is an explainable AI-based clinical decision support prototype designed to assist in the preliminary assessment of skin lesions. It uses deep transfer learning with **EfficientNet-B0** to classify dermoscopic images into benign and malignant categories, provides visual feature attribution through **Grad-CAM (Gradient-weighted Class Activation Mapping)**, delivers local multilingual voice output across 5 Indian languages, and exports formal 3-page landscape clinical PDF reports.

> **Medical & Ethical Disclaimer:** DermAI is an academic research prototype developed strictly for educational demonstration and decision-support exploration. It is **not** an approved medical device, and its outputs do **not** constitute medical advice, diagnosis, or treatment plans. A qualified healthcare professional (dermatologist) must evaluate any concerning skin lesion or abnormal skin change.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [System Architecture](#system-architecture)
- [Multilingual Voice & Audio System](#multilingual-voice--audio-system)
- [Explainable AI (Grad-CAM)](#explainable-ai-grad-cam)
- [Clinical Decision & Safety Guidance](#clinical-decision--safety-guidance)
- [3-Page Landscape PDF Report Export](#3-page-landscape-pdf-report-export)
- [Dataset & Model Benchmark](#dataset--model-benchmark)
- [Project Structure](#project-structure)
- [Installation and Setup](#installation-and-setup)
- [Running the Application](#running-the-application)
- [Limitations & Ethical Boundaries](#limitations--ethical-boundaries)
- [Team and Academic Context](#team-and-academic-context)

---

## Project Overview

DermAI addresses key clinical and technical challenges in computer-aided skin lesion screening:
1. **Binary Diagnostic Screening:** Classifying dermoscopic lesions as either Benign or Malignant using a class-weighted EfficientNet-B0 convolutional neural network fine-tuned on the benchmark HAM10000 collection.
2. **Explainable AI (XAI):** Demystifying deep neural decisions via full-width Grad-CAM activation mapping, allowing users to verify whether the model is focusing on legitimate morphological pigment networks rather than peripheral artifacts or hair.
3. **Automated Quality Pre-Screening:** Performing input format validation and Laplacian variance focus screening to flag blurry or low-contrast images before inference.
4. **Inclusive Multilingual Audio Accessibility:** Providing medically safe spoken explanations in **5 Indian languages** (English, Telugu, Kannada, Hindi, and Tamil) with zero cloud API keys, billing dependencies, or OS language packs.
5. **Modern Two-Column Clinical Layout & PDF Export:** Presenting balanced diagnostic outputs on a $1220\text{px}$ desktop grid, with one-click generation of an exact 3-page landscape assessment report.

---

## Key Features

- **EfficientNet-B0 Deep Learning:** Fine-tuned on confirmed dermoscopic images from the HAM10000 benchmark dataset.
- **Automated Image Quality Screening:** Computes Laplacian variance sharpness score (focus threshold $>15.0$) to detect blurry, unreadable images.
- **Full-Width Grad-CAM Visual Evidence:** Large side-by-side comparison of the original dermoscopic image against the Grad-CAM activation overlay (4:3 aspect ratio, no stretching or awkward cropping).
- **3-Stage Parameter Decomposition:** Expandable view decomposing Normalized Input ($224 \times 224$), Activation Heatmap (last convolutional gradients), and Superimposed Overlay.
- **Multilingual Voice & Text Guidance:** Spoken explanations and text translations in 5 languages:
  - English (`en-IN`)
  - Telugu (`te-IN` • తెలుగు)
  - Kannada (`kn-IN` • ಕನ್ನಡ)
  - Hindi (`hi-IN` • हिन्दी)
  - Tamil (`ta-IN` • தமிழ்)
- **Local Audio Engine:** 15 pre-rendered, verified high-definition MPEG Layer-III audio assets stored locally in `frontend/public/audio/`. Works 100% offline without paid cloud subscriptions.
- **Audio Controls:** Interactive **Listen**, **Pause**, **Resume**, and **Stop** controls, plus an optional English fallback voice button.
- **Compact Scoped Translation Control:** Single-line toggle allowing users to choose between:
  - `(●) Result only`: Webpage headers and navigation remain in English while the assessment result and voice are localized.
  - `(○) Entire page`: Webpage headers, navigation, ABCDE guide, and disclaimers are translated.
- **Structured Clinical Safety Framework:**
  - When to seek professional dermatologist evaluation.
  - Interactive ABCDE warning signs (Asymmetry, Border, Color, Diameter, Evolving).
  - Explicit explanation of diagnostic uncertainty factors.
  - Red flag indicators never to ignore.
  - Strict clinical boundaries (no drug prescriptions, no certainty guarantees).
- **Formal 3-Page Landscape PDF Export:** One-click report printing (`window.print()`) formatted via CSS Paged Media (`@page { size: landscape; }`) ensuring clean page breaks without split cards or trailing empty pages.

---

## Technology Stack

| Layer | Technologies & Tools |
|---|---|
| **Deep Learning** | PyTorch, torchvision, EfficientNet-B0 |
| **Explainable AI** | Grad-CAM (Gradient-weighted Class Activation Mapping) |
| **Backend API** | Python 3.10+, FastAPI, Uvicorn, Pydantic |
| **Computer Vision** | OpenCV (`cv2`), Pillow (`PIL`), NumPy |
| **Frontend Framework** | React 18, Vite 5/8 |
| **Styling & Paged Media** | Modern CSS3 (CSS Grid, Flexbox, `@page`, `@media print`) |
| **Audio Synthesis** | Pre-rendered MPEG Layer-III (MP3), HTML5 Web Audio API |
| **Data Evaluation** | scikit-learn, pandas, NumPy, GroupKFold |
| **Testing** | pytest, Requests |
| **Version Control** | Git, GitHub |

---

## System Architecture

```text
[ User Intake (Upload / Verified Benchmark Sample) ]
                         │
                         ▼
[ FastAPI Backend Pipeline (backend/main.py) ]
  ├── 1. Intake Validation: Format check (JPEG, PNG, WEBP), size limit (10MB)
  ├── 2. Image Quality Scan: Laplacian variance sharpness screening (cv2)
  ├── 3. Preprocessing: Resize 224x224, ImageNet normalization
  ├── 4. EfficientNet-B0 Inference: Softmax class probabilities (Benign vs Malignant)
  └── 5. Grad-CAM Engine: Gradient computation at final convolutional stage
                         │
                         ▼
[ React + Vite Responsive Frontend (App.jsx) ]
  ├── TOP SECTION (Two-Column Desktop Grid):
  │     ├── LEFT: Submitted Lesion Specimen & Quality Screening Card
  │     └── RIGHT: Model Decision (Score, Softmax Chips) & Scoped Language Selector
  ├── SECTION 2 (Full-Width Explainable AI):
  │     ├── Side-by-side Original vs Grad-CAM Overlay (4:3 aspect ratio)
  │     └── Expandable 3-Stage Feature Parameter Decomposition
  ├── SECTION 3 (Full-Width Patient Safety):
  │     ├── When to seek care & 5-Column ABCDE Warning Signs Grid
  │     ├── Diagnostic Uncertainty Factors & Red Flags
  │     └── Strict Clinical & Ethical Boundaries
  └── ACTIONS: Evaluate Another Image & Export 3-Page Landscape PDF Report
```

---

## Multilingual Voice & Audio System

DermAI eliminates language and literacy barriers through localized voice explanations:

- **15 Verified Local Audio Assets:**
  - 5 Languages: English, Telugu, Kannada, Hindi, Tamil.
  - 3 Clinical Scenarios:
    - `caseA`: Benign assessment explanation and routine observation guidance.
    - `caseB`: Concerning/Malignant assessment explanation and urgent dermatologist referral guidance.
    - `caseC`: Unsupported or blurry image notification requesting a clearer dermoscopic capture.
- **Audio Asset Location:** `frontend/public/audio/{lang}_{case}.mp3`
- **Zero Paid Dependencies:** Runs completely offline without Azure Speech or Google Cloud TTS billing dependencies.
- **Stateful Playback Controls:** Fully managed Listen, Pause, Resume, and Stop controls synchronized with the UI.

---

## Explainable AI (Grad-CAM)

DermAI integrates **Grad-CAM** at the final convolutional feature extraction stage of EfficientNet-B0:

1. **Feature Attribution:** Calculates gradients of the target class score with respect to feature activation maps.
2. **Visual Evidence:** Generates a heatmap highlighting morphological regions that contributed to the classification.
3. **Superimposed Overlay:** Blends the jet-colormap heatmap onto the normalized input lesion.
4. **Full-Width Presentation:** Equal-width panels ($560\text{px}+$ each) with preserved aspect ratio ensure that dermatoscopic borders, pigment reticulations, and vascular structures are fully visible without distortion.

---

## 3-Page Landscape PDF Report Export

Clicking **"Export assessment report"** triggers browser print preview with a dedicated `@media print` layout:

```text
┌─────────────────────────────────────────────────────────────┐
│ PAGE 1: EVALUATION SUMMARY & TWO-COLUMN ASSESSMENT         │
│ • Formal Header: Evaluation ID, Timestamps, Benchmark Meta  │
│ • LEFT: Submitted Specimen & Quality Screening (Complete)   │
│ • RIGHT: DermAI Prediction, Score & Localized Explanation   │
└─────────────────────────────────────────────────────────────┘
                              │ (break-before: page)
┌─────────────────────────────────────────────────────────────┐
│ PAGE 2: FULL-WIDTH EXPLAINABLE AI (GRAD-CAM) EVIDENCE       │
│ • Full-Width Visual Explanation Header                      │
│ • Large Equal-Width Panels: Original Image & Overlay        │
│ • Explanatory Caption Box                                   │
│ • 3-Stage Feature Decomposition (Compact Non-Splitting)    │
└─────────────────────────────────────────────────────────────┘
                              │ (break-before: page)
┌─────────────────────────────────────────────────────────────┐
│ PAGE 3: CLINICAL GUIDANCE & SAFETY BOUNDARIES               │
│ • When to Seek Professional Dermatologist Care              │
│ • ABCDE Warning Signs Grid (5 Columns Across)               │
│ • Diagnostic Uncertainty Factors & Urgent Red Flags         │
│ • Strict Clinical & Ethical Boundaries Safeguard            │
└─────────────────────────────────────────────────────────────┘
```

- **Orientation:** `@page { size: landscape; margin: 10mm 12mm; }`.
- **Clean Anti-Splitting:** Interactive buttons, audio controls, and radio selectors are automatically hidden. Headings and cards use `break-inside: avoid;` to prevent orphaned elements or empty pages.

---

## Dataset & Model Benchmark

Trained and evaluated on the benchmark **HAM10000** dermatoscopic collection using **StratifiedGroupKFold** grouped by patient `lesion_id` to prevent data leakage.

### Held-Out Test Set Performance ($N = 2,314$)

| Metric | Result (Threshold = 0.50) |
|---|---:|
| **Accuracy** | **88.38%** |
| **Malignant Recall (Sensitivity)** | **71.46%** |
| **Malignant Precision** | **67.84%** |
| **Specificity** | **92.25%** |
| **ROC-AUC** | **93.59%** |
| **Malignant F1-Score** | **69.60%** |

### Test Set Confusion Matrix ($N = 2,314$)

| Actual \ Predicted | Predicted Benign | Predicted Malignant |
|---|---:|---:|
| **Actual Benign** | 1,737 | 146 |
| **Actual Malignant** | 123 | 308 |

---

## Project Structure

```text
MAJOR_PROJECT/
├── backend/
│   └── main.py                     # FastAPI backend (Inference, Grad-CAM, Quality scan)
├── frontend/
│   ├── public/
│   │   ├── audio/                  # 15 Verified HD MP3 voice files (en, hi, kn, ta, te)
│   │   └── samples/                # Benchmark dermoscopic sample images
│   ├── src/
│   │   ├── clinicalTranslations.js # 5-language medical translations & audio player engine
│   │   ├── prototypeSamples.json   # Prototype sample definitions & metadata
│   │   ├── App.jsx                 # Main React UI (Two-column layout, Grad-CAM, Voice, Guidance)
│   │   └── index.css               # Styling, 1220px container, and 3-page landscape print CSS
│   ├── package.json
│   └── vite.config.js
├── src/
│   ├── image_quality.py            # Laplacian variance focus screening
│   └── input_validation.py         # Image format and dimensional constraints
├── tests/
│   ├── test_backend_api.py         # Backend endpoint tests
│   └── test_pipeline.py            # PyTorch pipeline tests
├── best_model.pth                  # Trained EfficientNet-B0 model checkpoint
├── app.py                          # Streamlit legacy / secondary research interface
├── audit_evaluation.py             # Evaluation audit script
├── audit_splits.py                 # Dataset partition leakage validation
├── README.md                       # Comprehensive project documentation
└── pytest.ini                      # Test runner configuration
```

---

## Installation and Setup

### Prerequisites

- **Python:** 3.10, 3.11, 3.12, or 3.13
- **Node.js:** 18+ and `npm`
- **Git**

### 1. Clone the Repository

```bash
git clone https://github.com/keerthireddy16/major-project-dermatology-cdss.git
cd major-project-dermatology-cdss
```

### 2. Set Up Python Environment

```bash
# Create and activate virtual environment
python -m venv .venv

# Windows:
.venv\Scripts\activate

# Linux / macOS:
source .venv/bin/activate

# Install dependencies:
pip install torch torchvision opencv-python pillow fastapi uvicorn pydantic requests python-multipart pytest
```

### 3. Install Frontend Dependencies

```bash
cd frontend
npm install
cd ..
```

---

## Running the Application

Run the backend and frontend in separate terminals:

### Terminal 1: Start FastAPI Backend

```bash
uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```
- API Docs: `http://127.0.0.1:8000/docs`

### Terminal 2: Start React Frontend

```bash
cd frontend
npm run dev
```
- Open browser at `http://localhost:5173`

### Run Test Suite

```bash
pytest
```

### Build Frontend for Production

```bash
cd frontend
npm run build
```

---

## Limitations & Ethical Boundaries

- **Academic Prototype:** DermAI is designed for academic evaluation and clinical workflow demonstration; it is **not** cleared by FDA, CE, or CDSCO as a medical device.
- **Dermoscopic Scope:** The model is trained on dermoscopic images. Ordinary mobile camera photographs under non-standardized lighting or focus may yield unreliable predictions.
- **No Diagnostic Prescriptions:** DermAI strictly provides preliminary triage guidance and will never prescribe topical medications, creams, or surgical treatments.
- **Mandatory Professional Review:** Any lesion displaying asymmetry, border irregularity, color variegation, or evolving changes must be examined in person by a board-certified dermatologist.

---

## Team and Academic Context

DermAI was developed as an undergraduate major project in **Computer Science and Engineering**. The project integrates deep learning, medical computer vision, explainable AI, audio accessibility, and modern web application development into a unified decision-support prototype.

- **Developer:** Keerthi Reddy
- **Institution:** Department of Computer Science & Engineering
- **Year:** 2026

---

*DermAI · Intelligent Skin Lesion Analysis — 2026*
