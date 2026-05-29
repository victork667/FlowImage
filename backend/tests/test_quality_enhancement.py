import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

from app.services.quality_enhancement.safe_upscale import resize_with_safe_upscale


def _blur_score(image: Image.Image) -> float:
    gray = cv2.cvtColor(np.asarray(image.convert("RGB")), cv2.COLOR_RGB2GRAY)
    return float(cv2.Laplacian(gray, cv2.CV_64F).var())


def test_safe_upscale_improves_edge_detail_when_image_is_small():
    source = Image.new("RGB", (120, 160), (148, 142, 136))
    draw = ImageDraw.Draw(source)
    draw.ellipse((34, 18, 86, 72), fill=(190, 160, 138), outline=(72, 58, 52), width=2)
    draw.rectangle((40, 72, 80, 138), fill=(42, 76, 126))
    source = source.filter(ImageFilter.GaussianBlur(radius=0.65))

    baseline = source.resize((600, 800), Image.Resampling.LANCZOS)
    enhanced = resize_with_safe_upscale(source, (600, 800))

    assert enhanced.size == (600, 800)
    assert _blur_score(enhanced) > _blur_score(baseline) * 1.12


def test_safe_upscale_preserves_flat_tones_without_color_shift():
    source = Image.new("RGB", (180, 220), (120, 118, 112))
    enhanced = resize_with_safe_upscale(source, (600, 800))
    arr = np.asarray(enhanced).astype(np.int16)

    assert enhanced.size == (600, 800)
    assert abs(float(arr[..., 0].mean()) - 120) < 2
    assert abs(float(arr[..., 1].mean()) - 118) < 2
    assert abs(float(arr[..., 2].mean()) - 112) < 2
    assert float(arr[..., 0].std()) < 1
    assert float(arr[..., 1].std()) < 1
    assert float(arr[..., 2].std()) < 1
