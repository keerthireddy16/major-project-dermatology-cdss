
from pathlib import Path
from PIL import Image

from src.input_validation import validate_image


def test_valid_jpeg(tmp_path: Path):
    image_path = tmp_path / "valid.jpg"
    Image.new("RGB", (300, 300), color="white").save(image_path)

    result = validate_image(image_path)

    assert result["valid"] is True
    assert result["width"] == 300
    assert result["height"] == 300


def test_unsupported_extension(tmp_path: Path):
    file_path = tmp_path / "notes.txt"
    file_path.write_text("not an image")

    result = validate_image(file_path)

    assert result["valid"] is False
    assert result["reason"] == "Unsupported file extension."


def test_missing_file():
    result = validate_image("file_that_does_not_exist.jpg")

    assert result["valid"] is False
    assert result["reason"] == "File not found."
