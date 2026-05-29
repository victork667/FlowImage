from app.models import PhotoTemplate
from app.services.face_detection.detector import FaceBox
from app.services.framing.crop import calculate_crop, constrain_crop_to_image
from app.services.photo_processing.memory_processor import process_image_bytes

from io import BytesIO

from PIL import Image


def test_calculate_crop_respects_target_aspect_ratio():
    template = PhotoTemplate(width=600, height=800, face_expand_x=2.2, face_expand_y=2.8)
    face = FaceBox(x=300, y=200, width=100, height=120, confidence=0.9)

    crop = calculate_crop(face, template, 1200, 1600)

    assert round(crop.width / crop.height, 2) == round(600 / 800, 2)
    assert crop.width > face.width
    assert crop.height > face.height


def test_calculate_crop_stays_inside_image_bounds():
    template = PhotoTemplate(width=600, height=800, face_expand_x=5, face_expand_y=5)
    face = FaceBox(x=20, y=30, width=80, height=90, confidence=0.9)

    crop = calculate_crop(face, template, 220, 260)

    assert crop.left >= 0
    assert crop.top >= 0
    assert crop.right <= 220
    assert crop.bottom <= 260


def test_constrain_crop_keeps_aspect_inside_small_source():
    crop = constrain_crop_to_image(
        crop=calculate_crop(
            FaceBox(x=120, y=100, width=60, height=70, confidence=0.9),
            PhotoTemplate(width=600, height=800),
            300,
            320,
        ),
        image_width=300,
        image_height=320,
        target_aspect=600 / 800,
    )

    assert crop.left >= 0
    assert crop.top >= 0
    assert crop.right <= 300
    assert crop.bottom <= 320
    assert round(crop.width / crop.height, 2) == round(600 / 800, 2)


def test_head_shoulders_small_source_fills_template_without_background_edges():
    source = Image.new("RGB", (180, 220), (20, 90, 170))
    buffer = BytesIO()
    source.save(buffer, "PNG")
    template = PhotoTemplate(
        width=600,
        height=800,
        shape="rectangular",
        crop_mode="head_shoulders",
        background_color="#ffffff",
        transparent_background=False,
        border_radius=0,
        output_format="PNG",
        output_quality=95,
    )

    result = process_image_bytes(
        db=None,
        image_bytes=buffer.getvalue(),
        original_filename="foto.png",
        template=template,
        studio_auto=False,
        enhance_quality=False,
    )
    final = Image.open(BytesIO(result.content)).convert("RGB")

    assert final.size == (600, 800)
    assert final.getpixel((0, 0)) != (255, 255, 255)
    assert final.getpixel((599, 799)) != (255, 255, 255)
