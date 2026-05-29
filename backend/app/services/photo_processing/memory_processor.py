from dataclasses import dataclass
from io import BytesIO
from pathlib import Path

from PIL import Image, ImageDraw, ImageOps
from sqlalchemy.orm import Session

from app.models import ColorPreset, PhotoTemplate
from app.schemas.process import ManualAdjustments
from app.services.color_adjustment.adaptive_studio import apply_adaptive_studio
from app.services.color_adjustment.adjust import apply_color_adjustments
from app.services.export.mask import apply_shape_mask, background_rgba
from app.services.face_detection.detector import DetectionResult, FaceBox, detect_faces_from_pil
from app.services.face_detection.face_mesh import build_face_mesh_mask, face_mesh_points
from app.services.framing.crop import CropBox, calculate_crop
from app.services.photo_analysis.quality import QualityAnalysis, analyze_photo_quality
from app.services.photo_processing.processor import centered_crop, crop_with_background, fit_image_inside_template
from app.services.quality_enhancement.safe_upscale import resize_with_safe_upscale
from app.storage.files import extension_for_format, safe_stem

MAX_WORK_IMAGE_SIDE = 2600


@dataclass
class MemoryProcessResult:
    content: bytes
    filename: str
    media_type: str
    detection: DetectionResult
    quality: QualityAnalysis


def process_image_bytes(
    db: Session,
    image_bytes: bytes,
    original_filename: str,
    template: PhotoTemplate,
    adjustments: ManualAdjustments | None = None,
    filename_suffix: str = "",
    studio_auto: bool = True,
    enhance_quality: bool = False,
    batch_mode: bool = False,
) -> MemoryProcessResult:
    source = normalize_source_image(ImageOps.exif_transpose(Image.open(BytesIO(image_bytes))).convert("RGB"))
    detection = detect_faces_from_pil(source)
    quality = analyze_photo_quality(source, detection)

    color_preset = None
    preset_id = adjustments.color_preset_id if adjustments and adjustments.color_preset_id else template.color_preset_id
    if preset_id:
        color_preset = db.get(ColorPreset, preset_id)

    mesh_face = detection.selected_face if batch_mode else refined_face_box(source, detection)
    if mesh_face:
        crop = calculate_crop(mesh_face, template, source.width, source.height, adjustments)
    else:
        crop = centered_crop(source, template)

    use_quality_enhancement = adjustments.enhance_quality if adjustments else enhance_quality

    if template.crop_mode == "contain":
        fitted = fit_image_inside_template(source, template, adjustments)
        if use_quality_enhancement:
            fitted = resize_with_safe_upscale(fitted, (template.width, template.height))
    else:
        cropped = crop_with_background(source, crop, template)
        fitted = resize_with_safe_upscale(cropped, (template.width, template.height)) if use_quality_enhancement else cropped.resize((template.width, template.height), Image.Resampling.LANCZOS)

    if adjustments and adjustments.rotation:
        fitted = fitted.rotate(adjustments.rotation, resample=Image.Resampling.BICUBIC, expand=False, fillcolor=background_rgba(template)[:3])

    use_studio_auto = adjustments.studio_auto if adjustments else studio_auto
    if use_studio_auto:
        adjusted = apply_adaptive_studio(fitted, None if batch_mode else build_face_mesh_mask(fitted))
        adjusted = apply_color_adjustments(adjusted, None, adjustments)
    else:
        adjusted = apply_color_adjustments(fitted, color_preset, adjustments)
    final = apply_shape_mask(adjusted, template)
    content = image_to_bytes(final, template)
    extension = extension_for_format(template.output_format)
    media_type = "image/jpeg" if extension == ".jpg" else "image/png"
    return MemoryProcessResult(
        content=content,
        filename=f"{download_stem(original_filename)}{filename_suffix}{extension}",
        media_type=media_type,
        detection=detection,
        quality=quality,
    )


def debug_face_bytes(image_bytes: bytes) -> bytes:
    source = normalize_source_image(ImageOps.exif_transpose(Image.open(BytesIO(image_bytes))).convert("RGB"))
    detection = detect_faces_from_pil(source)
    draw = ImageDraw.Draw(source)
    if detection.selected_face:
        face = detection.selected_face
        draw.rectangle((face.x, face.y, face.x + face.width, face.y + face.height), outline="#00c853", width=5)
    output = BytesIO()
    source.save(output, "JPEG", quality=90)
    return output.getvalue()


def image_to_bytes(image: Image.Image, template: PhotoTemplate) -> bytes:
    output = BytesIO()
    output_format = "JPEG" if template.output_format.upper() in {"JPG", "JPEG"} else "PNG"
    if output_format == "JPEG":
        image.convert("RGB").save(output, output_format, quality=template.output_quality, optimize=True)
    else:
        image.save(output, output_format, optimize=True)
    return output.getvalue()


def normalize_source_image(source: Image.Image) -> Image.Image:
    largest_side = max(source.width, source.height)
    if largest_side <= MAX_WORK_IMAGE_SIDE:
        return source
    normalized = source.copy()
    normalized.thumbnail((MAX_WORK_IMAGE_SIDE, MAX_WORK_IMAGE_SIDE), Image.Resampling.LANCZOS)
    return normalized


def download_stem(filename: str) -> str:
    stem = Path(filename).stem.strip()
    safe = "".join("_" if char in r'\/:*?"<>|' or ord(char) < 32 else char for char in stem)
    return safe.strip(" .") or safe_stem(filename)


def refined_face_box(source: Image.Image, detection: DetectionResult) -> FaceBox | None:
    points = face_mesh_points(source)
    if points is None:
        return detection.selected_face
    x, y, width, height = cv2_bounding_rect(points)
    if width <= 1 or height <= 1:
        return detection.selected_face
    confidence = detection.selected_face.confidence if detection.selected_face else 0.7
    return FaceBox(float(x), float(y), float(width), float(height), confidence)


def cv2_bounding_rect(points) -> tuple[int, int, int, int]:
    import cv2

    return cv2.boundingRect(points)
