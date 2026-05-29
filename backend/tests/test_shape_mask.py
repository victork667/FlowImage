from io import BytesIO

from PIL import Image

from app.models import PhotoTemplate
from app.services.export.mask import apply_shape_mask
from app.services.photo_processing.memory_processor import image_to_bytes


def test_rounded_shape_uses_default_radius_when_border_radius_is_zero():
    template = PhotoTemplate(
        width=200,
        height=260,
        shape="rounded",
        background_color="#ffffff",
        transparent_background=False,
        border_radius=0,
        output_format="PNG",
        output_quality=95,
    )
    source = Image.new("RGB", (200, 260), (20, 90, 170))

    result = apply_shape_mask(source, template)

    assert result.getpixel((0, 0)) == (255, 255, 255, 255)
    assert result.getpixel((100, 130))[:3] == (20, 90, 170)


def test_rounded_jpg_keeps_background_corners_instead_of_square_photo():
    template = PhotoTemplate(
        width=200,
        height=260,
        shape="rounded",
        background_color="#ffffff",
        transparent_background=False,
        border_radius=32,
        output_format="JPG",
        output_quality=95,
    )
    source = Image.new("RGB", (200, 260), (20, 90, 170))

    masked = apply_shape_mask(source, template)
    encoded = image_to_bytes(masked, template)
    decoded = Image.open(BytesIO(encoded)).convert("RGB")

    corner = decoded.getpixel((0, 0))
    center = decoded.getpixel((100, 130))
    assert all(channel > 245 for channel in corner)
    assert center[2] > center[0]


def test_transparent_rounded_png_keeps_alpha_corners():
    template = PhotoTemplate(
        width=200,
        height=260,
        shape="rounded",
        background_color="transparent",
        transparent_background=True,
        border_radius=32,
        output_format="PNG",
        output_quality=95,
    )
    source = Image.new("RGB", (200, 260), (20, 90, 170))

    result = apply_shape_mask(source, template)

    assert result.getpixel((0, 0))[3] == 0
    assert result.getpixel((100, 130))[3] == 255
