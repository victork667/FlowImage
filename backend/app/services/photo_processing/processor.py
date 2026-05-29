from pathlib import Path

from PIL import Image, ImageDraw, ImageOps
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models import ColorPreset, PhotoTemplate
from app.schemas.process import DetectionInfo, ManualAdjustments, ProcessResult
from app.services.color_adjustment.adjust import apply_color_adjustments
from app.services.export.mask import apply_shape_mask, background_rgba
from app.services.face_detection.detector import DetectionResult, detect_faces, save_face_debug
from app.services.framing.crop import CropBox, calculate_crop
from app.storage.files import extension_for_format, public_url, safe_stem, unique_filename


settings = get_settings()


def process_photo(
    db: Session,
    image_path: Path,
    original_filename: str,
    template: PhotoTemplate,
    adjustments: ManualAdjustments | None = None,
    filename_suffix: str = "_cracha",
) -> ProcessResult:
    detection = detect_faces(image_path)
    source = ImageOps.exif_transpose(Image.open(image_path)).convert("RGB")
    debug_face_path = settings.debug_dir / unique_filename(original_filename, "_face", ".jpg")
    save_face_debug(image_path, detection, debug_face_path)

    if not detection.selected_face:
        if adjustments is None:
            return ProcessResult(
                status="needs_review",
                debug_face_url=public_url(debug_face_path),
                detection=_detection_info(detection),
                error_message="Nenhum rosto foi detectado. A revisão manual pode salvar usando o centro da foto.",
            )
        debug_crop_path = settings.debug_dir / unique_filename(original_filename, "_manual_crop", ".jpg")
        crop = centered_crop(source, template)
        save_crop_debug(image_path, crop, debug_crop_path)
        final = render_without_face(db, source, template, adjustments)
        output_path = save_processed_image(final, original_filename, template, filename_suffix)
        return ProcessResult(
            status="processed",
            filename=output_path.name,
            download_url=public_url(output_path),
            processed_photo_path=str(output_path),
            debug_face_url=public_url(debug_face_path),
            debug_crop_url=public_url(debug_crop_path),
            detection=_detection_info(detection),
        )

    crop = calculate_crop(detection.selected_face, template, source.width, source.height, adjustments)
    debug_crop_path = settings.debug_dir / unique_filename(original_filename, "_crop", ".jpg")
    save_crop_debug(image_path, crop, debug_crop_path)

    color_preset = None
    preset_id = adjustments.color_preset_id if adjustments and adjustments.color_preset_id else template.color_preset_id
    if preset_id:
        color_preset = db.get(ColorPreset, preset_id)

    if template.crop_mode == "contain":
        fitted = fit_image_inside_template(source, template, adjustments)
    else:
        cropped = crop_with_background(source, crop, template)
        fitted = cropped.resize((template.width, template.height), Image.Resampling.LANCZOS)
    if adjustments and adjustments.rotation:
        fitted = fitted.rotate(adjustments.rotation, resample=Image.Resampling.BICUBIC, expand=False, fillcolor=background_rgba(template)[:3])
    adjusted = apply_color_adjustments(fitted, color_preset, adjustments)
    final = apply_shape_mask(adjusted, template)
    output_path = save_processed_image(final, original_filename, template, filename_suffix)

    return ProcessResult(
        status="processed",
        filename=output_path.name,
        download_url=public_url(output_path),
        processed_photo_path=str(output_path),
        debug_face_url=public_url(debug_face_path),
        debug_crop_url=public_url(debug_crop_path),
        detection=_detection_info(detection),
    )


def render_without_face(
    db: Session,
    source: Image.Image,
    template: PhotoTemplate,
    adjustments: ManualAdjustments,
) -> Image.Image:
    color_preset = db.get(ColorPreset, adjustments.color_preset_id) if adjustments.color_preset_id else None
    if template.crop_mode != "contain":
        crop = centered_crop(source, template)
        fitted = crop_with_background(source, crop, template).resize((template.width, template.height), Image.Resampling.LANCZOS)
    else:
        fitted = fit_image_inside_template(source, template, adjustments)
    if adjustments.rotation:
        fitted = fitted.rotate(adjustments.rotation, resample=Image.Resampling.BICUBIC, expand=False, fillcolor=background_rgba(template)[:3])
    adjusted = apply_color_adjustments(fitted, color_preset, adjustments)
    return apply_shape_mask(adjusted, template)


def crop_with_background(source: Image.Image, crop: CropBox, template: PhotoTemplate) -> Image.Image:
    if crop.left >= 0 and crop.top >= 0 and crop.right <= source.width and crop.bottom <= source.height:
        return source.crop((
            int(round(crop.left)),
            int(round(crop.top)),
            int(round(crop.right)),
            int(round(crop.bottom)),
        ))

    width = max(1, int(round(crop.width)))
    height = max(1, int(round(crop.height)))
    canvas = Image.new("RGB", (width, height), background_rgba(template)[:3])

    src_left = max(0, int(round(crop.left)))
    src_top = max(0, int(round(crop.top)))
    src_right = min(source.width, int(round(crop.right)))
    src_bottom = min(source.height, int(round(crop.bottom)))

    if src_right <= src_left or src_bottom <= src_top:
        return canvas

    region = source.crop((src_left, src_top, src_right, src_bottom))
    paste_x = max(0, int(round(-crop.left)))
    paste_y = max(0, int(round(-crop.top)))
    canvas.paste(region, (paste_x, paste_y))
    return canvas


def fit_image_inside_template(source: Image.Image, template: PhotoTemplate, adjustments: ManualAdjustments | None = None) -> Image.Image:
    canvas = Image.new("RGB", (template.width, template.height), background_rgba(template)[:3])
    zoom = adjustments.zoom if adjustments else 1.0
    scale = min(template.width / source.width, template.height / source.height) * zoom
    fitted_size = (max(1, int(round(source.width * scale))), max(1, int(round(source.height * scale))))
    fitted = source.resize(fitted_size, Image.Resampling.LANCZOS)
    offset_x = int(round((adjustments.offset_x if adjustments else 0.0) * template.width * 0.25))
    offset_y = int(round((adjustments.offset_y if adjustments else 0.0) * template.height * 0.25))
    paste_x = (template.width - fitted.width) // 2 + offset_x
    paste_y = (template.height - fitted.height) // 2 + offset_y
    canvas.paste(fitted, (paste_x, paste_y))
    return canvas


def centered_crop(source: Image.Image, template: PhotoTemplate) -> CropBox:
    target_aspect = template.width / template.height
    source_aspect = source.width / source.height
    if source_aspect > target_aspect:
        height = source.height
        width = height * target_aspect
    else:
        width = source.width
        height = width / target_aspect
    return CropBox((source.width - width) / 2, (source.height - height) / 2, width, height)


def save_crop_debug(image_path: Path, crop: CropBox, output_path: Path) -> None:
    image = ImageOps.exif_transpose(Image.open(image_path)).convert("RGB")
    draw = ImageDraw.Draw(image)
    draw.rectangle((crop.left, crop.top, crop.right, crop.bottom), outline="#2563eb", width=5)
    image.save(output_path, quality=92)


def save_processed_image(image: Image.Image, original_filename: str, template: PhotoTemplate, filename_suffix: str) -> Path:
    extension = extension_for_format(template.output_format)
    output_name = f"{safe_stem(original_filename)}{filename_suffix}{extension}"
    output_path = _available_output_path(output_name)
    save_final(image, output_path, template)
    return output_path


def save_final(image: Image.Image, output_path: Path, template: PhotoTemplate) -> None:
    output_format = "JPEG" if template.output_format.upper() in {"JPG", "JPEG"} else "PNG"
    if output_format == "JPEG":
        image.convert("RGB").save(output_path, output_format, quality=template.output_quality, optimize=True)
    else:
        image.save(output_path, output_format, optimize=True)


def _available_output_path(output_name: str) -> Path:
    target = settings.output_dir / output_name
    if not target.exists():
        return target
    return settings.output_dir / unique_filename(output_name, "", Path(output_name).suffix)


def _detection_info(detection: DetectionResult) -> DetectionInfo:
    face = detection.selected_face
    return DetectionInfo(
        face_detected=bool(face),
        face_count=detection.face_count,
        confidence=face.confidence if face else None,
        bounding_box={"x": face.x, "y": face.y, "width": face.width, "height": face.height} if face else None,
        center={"x": face.center_x, "y": face.center_y} if face else None,
        face_width=face.width if face else None,
        face_height=face.height if face else None,
        detector=detection.detector,
    )
