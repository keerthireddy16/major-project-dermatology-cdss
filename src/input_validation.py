
from pathlib import Path
from PIL import Image, UnidentifiedImageError

SUPPORTED_FORMATS = {"JPEG", "PNG", "WEBP"}
MAX_FILE_SIZE_MB = 10
MIN_WIDTH = 100
MIN_HEIGHT = 100
MAX_DIMENSION = 6000


def validate_image(image_path):
    """
    Validate that a file is a supported, decodable image.

    Returns:
        dict with keys:
            valid: bool
            reason: str
            width: int | None
            height: int | None
            image_format: str | None
    """
    path = Path(image_path)

    if not path.exists() or not path.is_file():
        return {
            "valid": False,
            "reason": "File not found.",
            "width": None,
            "height": None,
            "image_format": None,
        }

    if path.suffix.lower() not in {".jpg", ".jpeg", ".png", ".webp"}:
        return {
            "valid": False,
            "reason": "Unsupported file extension.",
            "width": None,
            "height": None,
            "image_format": None,
        }

    size_mb = path.stat().st_size / (1024 * 1024)

    if size_mb > MAX_FILE_SIZE_MB:
        return {
            "valid": False,
            "reason": f"File exceeds {MAX_FILE_SIZE_MB} MB limit.",
            "width": None,
            "height": None,
            "image_format": None,
        }

    try:
        with Image.open(path) as image:
            image_format = image.format
            width, height = image.size
            image.verify()

        if image_format not in SUPPORTED_FORMATS:
            return {
                "valid": False,
                "reason": "Image content format is not supported.",
                "width": width,
                "height": height,
                "image_format": image_format,
            }

        if width < MIN_WIDTH or height < MIN_HEIGHT:
            return {
                "valid": False,
                "reason": "Image resolution is too small.",
                "width": width,
                "height": height,
                "image_format": image_format,
            }

        if width > MAX_DIMENSION or height > MAX_DIMENSION:
            return {
                "valid": False,
                "reason": "Image dimensions exceed the allowed limit.",
                "width": width,
                "height": height,
                "image_format": image_format,
            }

        return {
            "valid": True,
            "reason": "File validation passed.",
            "width": width,
            "height": height,
            "image_format": image_format,
        }

    except (UnidentifiedImageError, OSError, ValueError):
        return {
            "valid": False,
            "reason": "File is corrupted or cannot be decoded as an image.",
            "width": None,
            "height": None,
            "image_format": None,
        }
