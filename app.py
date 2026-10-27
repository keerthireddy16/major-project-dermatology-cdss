import os
import tempfile
from pathlib import Path

import cv2
import numpy as np
import streamlit as st
import torch
import torch.nn as nn
from PIL import Image, UnidentifiedImageError
from torchvision import models, transforms

from src.image_quality import calculate_sharpness
from src.input_validation import validate_image

# ---------------------------------------------------------
# Page Configuration & Styling
# ---------------------------------------------------------
st.set_page_config(
    page_title="Dermatology AI - Clinical Decision Support System",
    page_icon="🔬",
    layout="wide",
    initial_sidebar_state="expanded",
)

st.markdown(
    """
    <style>
    /* Global Background & Typography */
    .stApp {
        background-color: #F8FAFC;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    }
    
    /* Compact Top Header */
    .header-container {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        border-bottom: 1px solid #E2E8F0;
        padding-bottom: 0.5rem;
        margin-bottom: 0.75rem;
    }
    .header-title {
        font-size: 1.45rem;
        font-weight: 700;
        color: #0F172A;
        letter-spacing: -0.02em;
        margin: 0;
    }
    .header-subtitle {
        font-size: 0.88rem;
        color: #475569;
        margin-top: 0.2rem;
    }
    .badge-prototype {
        display: inline-block;
        font-size: 0.72rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: #0F766E;
        background-color: #CCFBF1;
        border: 1px solid #99F6E4;
        padding: 0.2rem 0.6rem;
        border-radius: 9999px;
        white-space: nowrap;
    }
    
    /* Compact Medical Disclaimer */
    .disclaimer-card {
        background-color: #FFFBEB;
        border-left: 4px solid #F59E0B;
        border-right: 1px solid #FEF3C7;
        border-top: 1px solid #FEF3C7;
        border-bottom: 1px solid #FEF3C7;
        padding: 0.55rem 0.85rem;
        border-radius: 4px;
        color: #92400E;
        font-size: 0.82rem;
        line-height: 1.35;
        margin-bottom: 1rem;
    }
    
    /* Content Panels */
    .panel-card {
        background-color: #FFFFFF;
        border: 1px solid #E2E8F0;
        border-radius: 6px;
        padding: 1rem;
        margin-bottom: 0.9rem;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
    }
    .panel-header {
        font-size: 0.95rem;
        font-weight: 600;
        color: #1E293B;
        margin-bottom: 0.7rem;
        padding-bottom: 0.35rem;
        border-bottom: 1px solid #F1F5F9;
        text-transform: uppercase;
        letter-spacing: 0.03em;
    }

    /* Result Output Cards - Clinical & Restrained */
    .result-card-benign {
        background-color: #F0FDF4;
        border: 1px solid #86EFAC;
        border-left: 5px solid #16A34A;
        border-radius: 6px;
        padding: 0.85rem 1rem;
        margin-bottom: 0.85rem;
    }
    .result-card-malignant {
        background-color: #FEF2F2;
        border: 1px solid #FECACA;
        border-left: 5px solid #DC2626;
        border-radius: 6px;
        padding: 0.85rem 1rem;
        margin-bottom: 0.85rem;
    }
    .result-tag-benign {
        font-size: 0.75rem;
        font-weight: 700;
        color: #15803D;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }
    .result-tag-malignant {
        font-size: 0.75rem;
        font-weight: 700;
        color: #B91C1C;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }
    .result-primary-text {
        font-size: 1.35rem;
        font-weight: 700;
        color: #0F172A;
        margin-top: 0.2rem;
    }
    .result-secondary-text {
        font-size: 0.83rem;
        color: #475569;
        margin-top: 0.25rem;
        line-height: 1.3;
    }

    /* Guidance Box */
    .guidance-panel {
        background-color: #F8FAFC;
        border: 1px solid #E2E8F0;
        border-left: 4px solid #0D9488;
        padding: 0.75rem 0.9rem;
        border-radius: 4px;
        font-size: 0.83rem;
        color: #1E293B;
        line-height: 1.4;
        margin-top: 0.75rem;
    }

    /* Quality Screen Panel */
    .quality-screen-card {
        background-color: #FFFFFF;
        border: 1px solid #E2E8F0;
        border-radius: 6px;
        padding: 0.85rem 1rem;
        margin-top: 0.85rem;
        font-size: 0.83rem;
    }

    /* Compact Limitations Box */
    .limitation-card {
        background-color: #F8FAFC;
        border: 1px solid #E2E8F0;
        border-radius: 6px;
        padding: 0.7rem 0.85rem;
        font-size: 0.8rem;
        color: #64748B;
        line-height: 1.35;
        margin-top: 0.75rem;
    }

    /* Footer */
    .footer-text {
        text-align: center;
        color: #94A3B8;
        font-size: 0.78rem;
        margin-top: 1.5rem;
        padding-top: 0.75rem;
        border-top: 1px solid #E2E8F0;
    }
    </style>
    """,
    unsafe_allow_html=True,
)

# ---------------------------------------------------------
# Constants & Model Setup
# ---------------------------------------------------------
BASE_DIR = Path(__file__).resolve().parent
CHECKPOINT_PATH = BASE_DIR / "best_model.pth"
SAMPLE_DIR = BASE_DIR / "ISIC-images"

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

# Label mapping verified from train_model.py: 0 = Benign, 1 = Malignant
CLASS_NAMES = ["Benign", "Malignant"]


@st.cache_resource
def get_model():
    """Load and cache the trained EfficientNet-B0 model."""
    if not CHECKPOINT_PATH.is_file():
        raise FileNotFoundError(f"Model checkpoint not found at: {CHECKPOINT_PATH}")

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


def compute_gradcam(model, input_tensor, target_class_idx):
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

        # ReLU to keep only positive contributions
        cam = np.maximum(cam, 0)

        # Normalize to [0, 1]
        max_val = np.max(cam)
        if max_val > 0:
            cam = cam / max_val

        return cam
    finally:
        fwd_handle.remove()
        bwd_handle.remove()


def overlay_heatmap(image_pil, heatmap):
    """Overlay the 2D heatmap on the PIL image."""
    img_rgb = np.array(image_pil.convert("RGB").resize((224, 224)))
    heatmap_resized = cv2.resize(heatmap, (224, 224))
    heatmap_colored = cv2.applyColorMap(
        np.uint8(255 * heatmap_resized), cv2.COLORMAP_JET
    )
    heatmap_colored = cv2.cvtColor(heatmap_colored, cv2.COLOR_BGR2RGB)

    # Superimpose: 60% original image + 40% heatmap
    superimposed = np.uint8(0.6 * img_rgb + 0.4 * heatmap_colored)
    return superimposed


# ---------------------------------------------------------
# Sidebar: Streamlined Navigation & Research Context
# ---------------------------------------------------------
with st.sidebar:
    st.markdown("### Image Selection")
    input_mode = st.radio(
        "Source:",
        ["Upload File", "Benchmark Samples"],
        index=0,
        label_visibility="collapsed",
    )

    selected_sample = None
    if input_mode == "Benchmark Samples":
        sample_options = {
            "Benign Lesion (ISIC_0024306.jpg)": "ISIC_0024306.jpg",
            "Malignant Lesion (ISIC_0024310.jpg)": "ISIC_0024310.jpg",
            "Malignant Lesion (ISIC_0024313.jpg)": "ISIC_0024313.jpg",
            "Benign Lesion (ISIC_0024307.jpg)": "ISIC_0024307.jpg",
        }
        chosen_key = st.selectbox("Select Benchmark Lesion:", list(sample_options.keys()))
        selected_sample = SAMPLE_DIR / sample_options[chosen_key]

    st.markdown("---")

    # Technical specs placed in compact expanders
    with st.expander("Technical Architecture"):
        st.markdown(
            """
            - **Backbone:** EfficientNet-B0 (Transfer Learning)
            - **Input Spec:** 224 × 224 × 3 (ImageNet normalized)
            - **Classification Head:** Linear (1280 → 2)
            - **Trained Classes:** Benign (0), Malignant (1)
            - **Explainability:** Layer 8 Grad-CAM Attribution
            """
        )

    with st.expander("Demonstration Scenarios & Bounds"):
        st.markdown(
            """
            1. **Valid Dermoscopic Lesion:** Automated binary feature evaluation.
            2. **Normal Skin:** *Not clinically validated.* Training data contains only confirmed lesions.
            3. **Unreadable / Degraded Image:** Filtered by format validator or flagged by quality screen.
            4. **Concerning Lesion:** Clinical referral guidance triggered. Never self-prescribe or self-diagnose.
            """
        )


# ---------------------------------------------------------
# Top Header & Compact Warning Panel
# ---------------------------------------------------------
st.markdown(
    """
    <div class="header-container">
        <div>
            <div class="header-title">Dermatology Clinical Decision Support System</div>
            <div class="header-subtitle">AI-Assisted Preliminary Skin Lesion Evaluation with Explainable AI</div>
        </div>
        <span class="badge-prototype">Research Prototype</span>
    </div>
    """,
    unsafe_allow_html=True,
)

# Compact Medical Disclaimer Warning
st.markdown(
    """
    <div class="disclaimer-card">
        <strong>Medical Notice:</strong> This software is an experimental research prototype for clinical decision-support demonstration. 
        It does not diagnose cancer, rule out malignancy, or replace in-person dermatological examination. All findings require professional evaluation.
    </div>
    """,
    unsafe_allow_html=True,
)


# ---------------------------------------------------------
# Upload & Input Section
# ---------------------------------------------------------
active_file_path = None
uploaded_file = None

if input_mode == "Upload File":
    uploaded_file = st.file_uploader(
        "Upload Dermoscopic Image (JPEG, PNG, WEBP — Max 10MB, 100×100 to 6000×6000 px)",
        type=["jpg", "jpeg", "png", "webp"],
        help="Upload a single dermoscopic skin lesion image.",
    )
    if uploaded_file is not None:
        suffix = Path(uploaded_file.name).suffix.lower()
        if not suffix:
            suffix = ".jpg"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
            temp_file.write(uploaded_file.getvalue())
            active_file_path = Path(temp_file.name)
else:
    if selected_sample and selected_sample.exists():
        active_file_path = selected_sample
    else:
        st.error(f"Benchmark file not found at {selected_sample}")

# ---------------------------------------------------------
# Pipeline Execution & Main Dashboard Layout
# ---------------------------------------------------------
if active_file_path is not None:
    try:
        # Step 1: Input Validation
        validation_result = validate_image(active_file_path)

        if not validation_result["valid"]:
            st.error(f"Input Rejected: {validation_result['reason']}")
            st.info(
                "Requirement: Valid JPEG, PNG, or WEBP file with dimensions between 100×100 and 6000×6000 px and file size under 10MB."
            )
        else:
            # Step 2: Image Quality Screening (Experimental Laplacian Variance)
            sharpness_data = None
            try:
                sharpness_data = calculate_sharpness(active_file_path)
            except Exception as ex:
                st.warning(f"Quality screening note: {ex}")

            # Two-Column Dashboard Layout
            col_image, col_results = st.columns([1, 1], gap="large")

            # Left Column: Uploaded Image & Quality Screening Panel
            with col_image:
                st.markdown('<div class="panel-header">Uploaded Image</div>', unsafe_allow_html=True)
                opened_img = Image.open(active_file_path).convert("RGB")
                st.image(
                    opened_img,
                    caption=f"{validation_result['width']} × {validation_result['height']} px | Format: {validation_result['image_format']}",
                    use_container_width=True,
                )

                # Separate Image-Quality Screening Panel
                if sharpness_data:
                    score = sharpness_data["sharpness_score"]
                    is_low = score < 50.0

                    status_badge = "Quality Review Required" if is_low else "Screening Baseline Met"
                    border_color = "#F59E0B" if is_low else "#0D9488"
                    bg_color = "#FFFBEB" if is_low else "#F0FDFA"

                    st.markdown(
                        f"""
                        <div style="background-color: {bg_color}; border: 1px solid {border_color}; border-radius: 6px; padding: 0.75rem 0.9rem; margin-top: 0.8rem; font-size: 0.82rem; color: #1E293B;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
                                <strong>Experimental Quality Screen:</strong>
                                <span style="font-size: 0.75rem; font-weight: 600; color: {border_color};">{status_badge}</span>
                            </div>
                            <div>Sharpness Score (Laplacian variance): <code>{score:.2f}</code></div>
                            <div style="margin-top: 0.35rem; color: #64748B; font-size: 0.78rem; line-height: 1.35;">
                                Note: This screening metric is experimental and not clinically validated. It distinguishes high-frequency detail but does not definitively indicate image usability or diagnostic quality.
                            </div>
                        </div>
                        """,
                        unsafe_allow_html=True,
                    )

            # Right Column: Inference Results & Cautious Clinical Support
            with col_results:
                st.markdown('<div class="panel-header">Model Inference & Analysis</div>', unsafe_allow_html=True)

                with st.spinner("Processing image through EfficientNet-B0..."):
                    model = get_model()
                    input_tensor = PREPROCESS(opened_img).unsqueeze(0)

                    with torch.inference_mode():
                        logits = model(input_tensor)
                        probabilities = torch.softmax(logits, dim=1)[0]

                    benign_score = probabilities[0].item() * 100
                    malignant_score = probabilities[1].item() * 100
                    predicted_index = int(torch.argmax(probabilities).item())
                    predicted_class = CLASS_NAMES[predicted_index]

                # Restrained, Professional Result Cards
                if predicted_class == "Malignant":
                    st.markdown(
                        f"""
                        <div class="result-card-malignant">
                            <div class="result-tag-malignant">Potentially Concerning Lesion Pattern</div>
                            <div class="result-primary-text">Malignant Score: {malignant_score:.2f}%</div>
                            <div class="result-secondary-text">
                                The model detected features corresponding to malignant lesion patterns in the training dataset.
                            </div>
                        </div>
                        """,
                        unsafe_allow_html=True,
                    )
                else:
                    st.markdown(
                        f"""
                        <div class="result-card-benign">
                            <div class="result-tag-benign">Preliminary Benign Lesion Pattern</div>
                            <div class="result-primary-text">Benign Score: {benign_score:.2f}%</div>
                            <div class="result-secondary-text">
                                The model detected features corresponding predominantly to benign lesion patterns in the training dataset.
                            </div>
                        </div>
                        """,
                        unsafe_allow_html=True,
                    )

                # Class Probabilities Breakdown
                st.markdown("<div style='font-size: 0.85rem; font-weight: 600; color: #334155; margin-bottom: 0.3rem;'>Class Probabilities:</div>", unsafe_allow_html=True)
                
                b_col1, b_col2 = st.columns([3, 1])
                with b_col1:
                    st.progress(benign_score / 100.0)
                with b_col2:
                    st.caption(f"Benign: **{benign_score:.2f}%**")

                m_col1, m_col2 = st.columns([3, 1])
                with m_col1:
                    st.progress(malignant_score / 100.0)
                with m_col2:
                    st.caption(f"Malignant: **{malignant_score:.2f}%**")

                # Cautious Clinical Support Guidance
                if predicted_class == "Malignant" or malignant_score > 30.0:
                    st.markdown(
                        """
                        <div class="guidance-panel" style="border-left-color: #DC2626; background-color: #FEF2F2;">
                            <strong>Clinical Assessment Advisory:</strong> The classifier indicates elevated malignant class characteristics. 
                            Prompt evaluation by a qualified dermatologist is recommended for comprehensive clinical examination and formal assessment. 
                            Automated tools cannot diagnose or rule out skin cancer.
                        </div>
                        """,
                        unsafe_allow_html=True,
                    )
                else:
                    st.markdown(
                        """
                        <div class="guidance-panel">
                            <strong>Clinical Assessment Advisory:</strong> Preliminary model output aligns with benign lesion patterns. 
                            This does not rule out malignancy or confirm skin health. If the lesion demonstrates changes in color, size, symmetry, 
                            borders, or symptoms, prompt professional dermatological evaluation is recommended.
                        </div>
                        """,
                        unsafe_allow_html=True,
                    )

                # Honest Limitation Note Regarding Normal Skin
                st.markdown(
                    """
                    <div class="limitation-card">
                        <strong>Clinical Boundary (Normal Skin):</strong> The underlying model was trained exclusively on confirmed dermoscopic lesions (HAM10000/ISIC). 
                        It has not been validated to evaluate normal, healthy skin. Submitting non-lesion skin will produce forced, unvalidated classifications.
                    </div>
                    """,
                    unsafe_allow_html=True,
                )

            # ---------------------------------------------------------
            # Explainable AI (Grad-CAM) Section
            # ---------------------------------------------------------
            st.markdown("<br>", unsafe_allow_html=True)
            st.markdown('<div class="panel-header">Explainable AI (Grad-CAM Feature Attribution)</div>', unsafe_allow_html=True)
            st.caption(
                "Grad-CAM (Gradient-weighted Class Activation Mapping) visualizes the spatial image regions that influenced the model's classification score. "
                "This visualizes mathematical layer attributions, not medically validated biological criteria."
            )

            try:
                heatmap = compute_gradcam(model, input_tensor, predicted_index)

                if heatmap is not None:
                    overlay = overlay_heatmap(opened_img, heatmap)

                    xai_c1, xai_c2, xai_c3 = st.columns(3, gap="medium")
                    with xai_c1:
                        st.caption("1. Preprocessed Input (224×224)")
                        st.image(opened_img.resize((224, 224)), use_container_width=True)
                    with xai_c2:
                        st.caption(f"2. Grad-CAM Activation ({predicted_class})")
                        st.image(heatmap, clamp=True, use_container_width=True)
                    with xai_c3:
                        st.caption("3. Superimposed Lesion Overlay")
                        st.image(overlay, use_container_width=True)
                else:
                    st.info("Feature attribution could not be calculated for this input.")
            except Exception as cam_err:
                st.warning(f"Grad-CAM generation notice: {cam_err}")

    except Exception as e:
        st.error(f"Inference processing error: {str(e)}")
    finally:
        # Clean up temporary upload file if one was created
        if uploaded_file is not None and active_file_path and active_file_path.exists():
            try:
                os.remove(active_file_path)
            except OSError:
                pass
else:
    st.info("Select an image from the sidebar or upload a dermoscopic image to begin analysis.")

# ---------------------------------------------------------
# Compact Footer
# ---------------------------------------------------------
st.markdown(
    """
    <div class="footer-text">
        AI-Based Clinical Decision Support System | Preliminary Research Prototype | Not a Medical Device
    </div>
    """,
    unsafe_allow_html=True,
)
