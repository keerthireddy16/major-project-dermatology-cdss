
import cv2
import numpy as np


def calculate_sharpness(image_path):
    """
    Calculate variance of the Laplacian as an image sharpness indicator.

    Higher values often indicate more high-frequency detail.
    This score alone cannot reliably determine whether a medical
    image is usable.
    """
    image = cv2.imread(str(image_path))

    if image is None:
        raise ValueError("Unable to decode image for quality analysis.")

    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    score = float(cv2.Laplacian(gray, cv2.CV_64F).var())

    return {
        "sharpness_score": score,
        "quality_status": "REVIEW_REQUIRED",
        "message": (
            "Sharpness score calculated. A validated threshold is "
            "required before automatic acceptance or rejection."
        ),
    }
