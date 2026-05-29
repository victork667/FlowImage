from dataclasses import dataclass

from app.models import PhotoTemplate
from app.schemas.process import ManualAdjustments
from app.services.face_detection.detector import FaceBox


@dataclass
class CropBox:
    left: float
    top: float
    width: float
    height: float

    @property
    def right(self) -> float:
        return self.left + self.width

    @property
    def bottom(self) -> float:
        return self.top + self.height


def calculate_crop(
    face: FaceBox,
    template: PhotoTemplate,
    image_width: int,
    image_height: int,
    adjustments: ManualAdjustments | None = None,
) -> CropBox:
    adjustments = adjustments or ManualAdjustments()
    zoom_default = _value(template.zoom_default, 1.0)
    zoom = max(0.2, zoom_default * adjustments.zoom)

    crop_width = face.width * _value(template.face_expand_x, 2.2) / zoom
    crop_height = face.height * _value(template.face_expand_y, 2.8) / zoom
    target_aspect = _value(template.width, 600) / _value(template.height, 800)
    crop_aspect = crop_width / crop_height

    if crop_aspect < target_aspect:
        crop_width = crop_height * target_aspect
    else:
        crop_height = crop_width / target_aspect

    center_x = face.center_x + (face.width * (_value(template.offset_x_default, 0.0) + adjustments.offset_x))
    center_y = face.center_y + (
        face.height * (_value(template.face_offset_y, -0.15) + _value(template.offset_y_default, 0.0) + adjustments.offset_y)
    )

    top_margin_target = crop_height * _value(template.head_top_margin, 0.12)
    face_top_margin = face.y - (center_y - crop_height / 2)
    if face_top_margin < top_margin_target:
        center_y -= top_margin_target - face_top_margin

    shoulder_extra = face.height * _value(template.shoulder_visibility, 0.25)
    center_y += shoulder_extra * 0.15

    crop = CropBox(center_x - crop_width / 2, center_y - crop_height / 2, crop_width, crop_height)
    return constrain_crop_to_image(crop, image_width, image_height, target_aspect)


def constrain_crop_to_image(crop: CropBox, image_width: int, image_height: int, target_aspect: float) -> CropBox:
    image_width = max(1.0, float(image_width))
    image_height = max(1.0, float(image_height))
    target_aspect = max(0.01, target_aspect)

    width = min(crop.width, image_width)
    height = width / target_aspect
    if height > image_height:
        height = image_height
        width = height * target_aspect

    width = min(width, image_width)
    height = min(height, image_height)
    center_x = crop.left + crop.width / 2
    center_y = crop.top + crop.height / 2

    left = _clamp(center_x - width / 2, 0, image_width - width)
    top = _clamp(center_y - height / 2, 0, image_height - height)
    return CropBox(left, top, width, height)


def _value(value: float | int | None, fallback: float) -> float:
    return fallback if value is None else float(value)


def _clamp(value: float, minimum: float, maximum: float) -> float:
    if maximum < minimum:
        return minimum
    return max(minimum, min(value, maximum))
