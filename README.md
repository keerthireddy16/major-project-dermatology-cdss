# DermAI — AI-Based Clinical Decision Support System for Dermatological Diseases

DermAI is an AI-based clinical decision support prototype designed to assist in the preliminary assessment of skin lesions. It uses deep learning to classify skin lesion images, provides visual explanations through Grad-CAM, and presents assessment results through a web-based interface.

> **Medical Disclaimer:** DermAI is an academic research prototype, not a medical device. Its predictions are not a substitute for professional medical advice, diagnosis, or treatment. A qualified healthcare professional must evaluate any concerning skin lesion.

## Table of Contents

- [Project Overview](#project-overview)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [System Architecture](#system-architecture)
- [Dataset](#dataset)
- [Model Evaluation](#model-evaluation)
- [Project Structure](#project-structure)
- [Installation and Setup](#installation-and-setup)
- [Running the Application](#running-the-application)
- [Explainable AI](#explainable-ai)
- [Limitations](#limitations)
- [Future Enhancements](#future-enhancements)
- [Team and Academic Context](#team-and-academic-context)

## Project Overview

DermAI integrates computer vision, deep learning, explainable AI, and web technologies into a single application for preliminary skin lesion assessment.

The system uses a trained **EfficientNet-B0** model to process skin lesion images and generate a prediction. The application presents the assessment results and uses **Gradient-weighted Class Activation Mapping (Grad-CAM)** to highlight image regions that influenced the model's output.

The project focuses on model evaluation, interpretability, accessibility through a web interface, and transparent communication of the system's limitations.

## Key Features

- **AI-based image classification:** Uses a trained EfficientNet-B0 model for binary benign-versus-malignant classification.
- **Image intake:** Provides a web interface for submitting skin lesion images.
- **Assessment results:** Displays model predictions and associated confidence information.
- **Explainable AI:** Uses Grad-CAM heatmaps to visualize image regions contributing to the prediction.
- **Research details:** Presents model evaluation metrics and experimental results.
- **REST API:** Uses FastAPI to connect the frontend with the inference pipeline.
- **Responsive web interface:** Built with React and Vite.
- **Automated testing:** Includes tests for the prediction pipeline and backend API.

## Technology Stack

| Component | Technology |
|---|---|
| Programming language | Python, JavaScript |
| Deep learning | PyTorch, EfficientNet-B0 |
| Backend | FastAPI |
| Frontend | React, Vite, CSS |
| Image processing | Pillow, torchvision |
| Explainability | Grad-CAM |
| Data analysis and evaluation | NumPy, pandas, scikit-learn |
| Testing | pytest |
| Version control | Git and GitHub |

## System Architecture

The application follows an image-inference workflow:

1. The user uploads a skin lesion image through the frontend.
2. The frontend sends the image to the FastAPI backend.
3. The backend preprocesses the image using the model's required input transformations.
4. The trained EfficientNet-B0 model generates a prediction score.
5. The system applies the configured decision threshold to produce a binary classification.
6. Grad-CAM generates a visual explanation of the model's prediction.
7. The frontend displays the assessment and explanation.

```text
User
  |
  v
React + Vite Frontend
  |
  v
FastAPI Backend
  |
  v
Image Preprocessing
  |
  v
Trained EfficientNet-B0
  |
  +------> Prediction Score
  |
  +------> Grad-CAM Explanation
  |
  v
Assessment Results
```

## Dataset

The project uses the **HAM10000 (Human Against Machine with 10000 training images) dataset**, a publicly available collection of dermatoscopic skin lesion images.

The project uses a binary classification setup:

- **Benign:** Non-malignant class.
- **Malignant:** Malignant class.

The evaluation workflow uses separate training, validation, and test partitions. The test partition is used to assess the model's performance on held-out images.

The test set contains **2,314 images**:

| Class | Number of images |
|---|---:|
| Benign | 1,883 |
| Malignant | 431 |
| **Total** | **2,314** |

Dataset source: [HAM10000 — Harvard Dataverse](https://doi.org/10.7910/DVN/DBW86T)

**Important:** The dataset is intended for research and educational use. Dataset labels, class mapping, preprocessing, and partitioning must be verified before reproducing the experiments.

## Model Evaluation

The trained EfficientNet-B0 checkpoint is evaluated on the held-out test set. The following results represent the baseline operating threshold of **0.50**.

### Baseline results

| Metric | Result |
|---|---:|
| Accuracy | 88.38% |
| Malignant precision | 67.84% |
| Malignant recall (sensitivity) | 71.46% |
| Malignant F1-score | 69.60% |
| Specificity | 92.25% |
| ROC-AUC | 93.59% |

### Confusion matrix

Rows represent actual classes; columns represent predicted classes.

| Actual / Predicted | Benign | Malignant |
|---|---:|---:|
| Benign | 1,737 | 146 |
| Malignant | 123 | 308 |

### Alternative decision threshold

A lower threshold, approximately **0.31**, has also been examined as a sensitivity-oriented operating point.

| Metric | Previously reported result |
|---|---:|
| Accuracy | 86.47% |
| Malignant precision | 59.61% |
| Malignant recall | 84.92% |
| Malignant F1-score | 70.05% |

Lowering the threshold increases malignant sensitivity at the cost of more false-positive predictions.

**Evaluation note:** The provenance of the previously reported lower threshold has not been independently established. It should therefore be treated as a previously reported operating point, not as a confirmed validation-selected clinical threshold. The 0.50 baseline is the primary reproducible benchmark.

These results are experimental model metrics, not evidence of clinical effectiveness. Performance on other populations, image acquisition conditions, and real-world clinical data may differ.

## Project Structure

```text
MAJOR_PROJECT/
├── backend/
│   └── main.py
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── tests/
│   ├── test_backend_api.py
│   └── test_pipeline.py
├── presentation_screenshots/
├── app.py
├── predict.py
├── audit_evaluation.py
├── audit_splits.py
├── audit_test_thresholds.py
├── pytest.ini
└── README.md
```

The trained model checkpoint and dataset files are not included in this structure because they may need to be obtained or configured separately.

## Installation and Setup

### Prerequisites

Install the following:

- Python 3.10 or another Python version supported by the project's dependencies.
- Node.js and npm.
- Git.
- The trained model checkpoint and the required dataset files.

### 1. Clone the repository

```bash
git clone https://github.com/keerthireddy16/major-project-dermatology-cdss.git
cd major-project-dermatology-cdss
```

### 2. Set up the Python environment

On Windows:

```bash
python -m venv .venv
.venv\Scripts\activate
```

Install the Python dependencies required by the backend, model, and tests.

If the repository contains a `requirements.txt` file:

```bash
pip install -r requirements.txt
```

If it does not, install the dependencies specified by the project's Python imports and environment configuration. The exact dependency versions should be pinned before attempting a reproducible installation.

### 3. Configure the model and dataset

Obtain the trained `best_model.pth` checkpoint from the project owner or its original training environment. Place it at the path expected by the backend and prediction pipeline, or configure the model path accordingly.

Obtain the required HAM10000 images and metadata separately. Configure the dataset and CSV paths to match the project's expected directory structure.

The model checkpoint and dataset images are not automatically downloaded by the application.

### 4. Install frontend dependencies

Open a terminal in the project root:

```bash
cd frontend
npm install
```

## Running the Application

Run the backend and frontend in separate terminals.

### Start the backend

From the project root, activate the Python environment and run:

```bash
uvicorn backend.main:app --reload
```

The backend will normally be available at:

```text
http://127.0.0.1:8000
```

If FastAPI's interactive API documentation is enabled, access:

```text
http://127.0.0.1:8000/docs
```

### Start the frontend

In another terminal:

```bash
cd frontend
npm run dev
```

Open the local URL printed by Vite in the terminal, commonly:

```text
http://localhost:5173
```

Ensure the frontend's API configuration points to the running backend. The model checkpoint, Python dependencies, dataset paths, and any required environment variables must be configured before inference can work correctly.

### Run tests

From the project root, with the Python environment activated:

```bash
pytest
```

### Build the frontend

```bash
cd frontend
npm run build
```

The build command checks whether the frontend can be compiled for production.

## Explainable AI

DermAI uses **Grad-CAM** to create a heatmap highlighting image regions associated with the model's prediction.

The explanation is intended to help users inspect which regions influenced the model output. It does not establish that the highlighted regions are medically meaningful, nor does it prove that the prediction is correct.

## Limitations

- The system is a research prototype and is not validated for independent clinical diagnosis.
- Predictions depend on image quality, dataset composition, model training, and preprocessing.
- Class imbalance can affect precision, recall, and the number of false-positive and false-negative predictions.
- A decision threshold changes the trade-off between sensitivity and specificity.
- Grad-CAM provides a visual explanation, not a causal explanation or clinical justification.
- The reported evaluation results do not guarantee performance on external clinical datasets.
- The current binary classification setup does not represent the full range of dermatological diseases.

## Future Enhancements

- Evaluate generalization using independent external datasets.
- Improve threshold selection using validation-only data and a documented selection procedure.
- Expand testing for image uploads, invalid inputs, and API failure cases.
- Improve model calibration and uncertainty communication.
- Explore multimodal assessment incorporating structured clinical information, with appropriate validation.
- Conduct rigorous clinical evaluation and obtain the required regulatory and ethical approvals before any clinical deployment.

## Team and Academic Context

DermAI is an academic major project developed as part of undergraduate engineering work in Computer Science and Engineering.

The project demonstrates the integration of deep learning, computer vision, explainable AI, backend API development, and frontend engineering into a research-oriented clinical decision support prototype.

## License and Attribution

The project code's license should be specified by the project maintainers before redistribution. HAM10000 is a third-party dataset; users must follow the dataset's original terms and attribution requirements.

---

**Disclaimer:** DermAI is intended for academic research and educational demonstration only. It must not be used as the sole basis for diagnosis, treatment, or other medical decisions.
