import cv2
import numpy as np
from PIL import Image, ImageEnhance

from app.models import ColorPreset
from app.schemas.process import ManualAdjustments
from app.services.color_adjustment.color_safety import apply_light_neutral_finish, neutralize_warm_cast


def apply_color_adjustments(
    image: Image.Image,
    preset: ColorPreset | None,
    adjustments: ManualAdjustments | None = None,
) -> Image.Image:
    has_manual_adjustments = adjustments is not None
    adjustments = adjustments or ManualAdjustments()

    if has_manual_adjustments:
        return _apply_manual_adjustments(image, adjustments)

    brightness = adjustments.brightness if adjustments.brightness is not None else (preset.brightness if preset else 1.0)
    contrast = adjustments.contrast if adjustments.contrast is not None else (preset.contrast if preset else 1.0)
    saturation = adjustments.saturation if adjustments.saturation is not None else (preset.saturation if preset else 1.0)
    sharpness = adjustments.sharpness if adjustments.sharpness is not None else (preset.sharpness if preset else 1.0)
    auto_white_balance = bool(preset.auto_white_balance if preset else False)
    shadow_reduction = preset.shadow_reduction if preset else 0.0

    result = image.convert("RGB")
    if auto_white_balance:
        result = _auto_white_balance(result)
    preset_temperature = min(preset.temperature, 0) if preset and preset.temperature else 0.0
    if preset_temperature:
        result = _apply_temperature(result, preset_temperature)
    if shadow_reduction:
        result = _reduce_shadows(result, shadow_reduction)

    result = ImageEnhance.Brightness(result).enhance(brightness)
    result = ImageEnhance.Contrast(result).enhance(contrast)
    result = ImageEnhance.Color(result).enhance(saturation)
    result = ImageEnhance.Sharpness(result).enhance(sharpness)
    return apply_light_neutral_finish(result)


def _apply_manual_adjustments(image: Image.Image, adjustments: ManualAdjustments) -> Image.Image:
    result = image.convert("RGB")
    if adjustments.auto_white_balance:
        result = _auto_white_balance(result, strength=0.72)
    if adjustments.temperature:
        result = _apply_temperature(result, adjustments.temperature)
    if adjustments.shadow_reduction:
        result = _reduce_shadows(result, adjustments.shadow_reduction)
    if adjustments.highlight_recovery:
        result = _recover_highlights(result, adjustments.highlight_recovery)
    if adjustments.gamma != 1.0:
        result = _apply_gamma(result, adjustments.gamma)

    result = ImageEnhance.Brightness(result).enhance(adjustments.brightness if adjustments.brightness is not None else 1.0)
    result = _apply_lab_contrast(result, adjustments.contrast if adjustments.contrast is not None else 1.0)
    result = ImageEnhance.Color(result).enhance(adjustments.saturation if adjustments.saturation is not None else 1.0)
    if adjustments.vibrance:
        result = _apply_vibrance(result, adjustments.vibrance)
    if adjustments.clarity:
        result = _apply_clarity(result, adjustments.clarity)
    result = ImageEnhance.Sharpness(result).enhance(adjustments.sharpness if adjustments.sharpness is not None else 1.0)
    return neutralize_warm_cast(result)


def _auto_white_balance(image: Image.Image, strength: float = 1.0) -> Image.Image:
    arr = np.asarray(image).astype(np.float32)
    avg = arr.reshape(-1, 3).mean(axis=0)
    gray = avg.mean()
    gains = gray / np.maximum(avg, 1)
    arr *= 1.0 + ((gains - 1.0) * strength)
    return Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))


def _apply_temperature(image: Image.Image, value: float) -> Image.Image:
    value = max(-60.0, min(8.0, value))
    arr = np.asarray(image).astype(np.float32)
    arr[..., 0] += value * 1.05
    arr[..., 1] += value * 0.18
    arr[..., 2] -= value * 1.0
    return Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))


def _reduce_shadows(image: Image.Image, amount: float) -> Image.Image:
    arr = np.asarray(image)
    lab = cv2.cvtColor(arr, cv2.COLOR_RGB2LAB)
    l_channel, a_channel, b_channel = cv2.split(lab)
    l_float = l_channel.astype(np.float32)
    shadow_weight = np.clip((150 - l_float) / 150, 0, 1) ** 1.25
    lift = np.clip((155 - l_float) * amount * 0.48 * shadow_weight, 0, 58)
    l_channel = np.clip(l_float + lift, 0, 255).astype(np.uint8)
    merged = cv2.merge((l_channel, a_channel, b_channel))
    return Image.fromarray(cv2.cvtColor(merged, cv2.COLOR_LAB2RGB))


def _recover_highlights(image: Image.Image, amount: float) -> Image.Image:
    arr = np.asarray(image)
    lab = cv2.cvtColor(arr, cv2.COLOR_RGB2LAB)
    l_channel, a_channel, b_channel = cv2.split(lab)
    l_float = l_channel.astype(np.float32)
    mask = l_float > 176
    if mask.any():
        weight = np.clip((l_float[mask] - 176) / 72, 0, 1)
        l_float[mask] -= (l_float[mask] - 176) * amount * 0.62 * weight
    merged = cv2.merge((np.clip(l_float, 0, 255).astype(np.uint8), a_channel, b_channel))
    return Image.fromarray(cv2.cvtColor(merged, cv2.COLOR_LAB2RGB))


def _apply_gamma(image: Image.Image, gamma: float) -> Image.Image:
    exponent = max(0.05, gamma)
    table = np.array([((idx / 255.0) ** exponent) * 255 for idx in range(256)]).astype("uint8")
    return Image.fromarray(cv2.LUT(np.asarray(image), table))


def _apply_clarity(image: Image.Image, amount: float) -> Image.Image:
    arr = np.asarray(image).astype(np.uint8)
    lab = cv2.cvtColor(arr, cv2.COLOR_RGB2LAB)
    l_channel, a_channel, b_channel = cv2.split(lab)
    l_float = l_channel.astype(np.float32)
    blurred = cv2.GaussianBlur(l_float, (0, 0), sigmaX=1.6, sigmaY=1.6)
    detail = l_float - blurred
    gradient_x = cv2.Sobel(l_float, cv2.CV_32F, 1, 0, ksize=3)
    gradient_y = cv2.Sobel(l_float, cv2.CV_32F, 0, 1, ksize=3)
    edge_weight = np.clip((cv2.magnitude(gradient_x, gradient_y) - 4.0) / 36.0, 0, 1)
    strength = min(0.68, amount * 0.72)
    l_float = l_float + detail * strength * (0.35 + edge_weight * 0.65)
    merged = cv2.merge((np.clip(l_float, 0, 255).astype(np.uint8), a_channel, b_channel))
    return Image.fromarray(cv2.cvtColor(merged, cv2.COLOR_LAB2RGB))


def _apply_vibrance(image: Image.Image, amount: float) -> Image.Image:
    hsv = cv2.cvtColor(np.asarray(image), cv2.COLOR_RGB2HSV).astype(np.float32)
    saturation = hsv[..., 1] / 255.0
    multiplier = 1.0 + (amount * (1.0 - saturation) * 1.65)
    hsv[..., 1] = np.clip(hsv[..., 1] * multiplier, 0, 255)
    return Image.fromarray(cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2RGB))


def _apply_lab_contrast(image: Image.Image, contrast: float) -> Image.Image:
    if contrast == 1.0:
        return image
    arr = np.asarray(image.convert("RGB"))
    lab = cv2.cvtColor(arr, cv2.COLOR_RGB2LAB)
    l_channel, a_channel, b_channel = cv2.split(lab)
    l_float = l_channel.astype(np.float32)
    center = float(np.percentile(l_float, 50))
    strength = 1.0 + ((contrast - 1.0) * 1.35)
    l_float = center + ((l_float - center) * strength)
    merged = cv2.merge((np.clip(l_float, 0, 255).astype(np.uint8), a_channel, b_channel))
    return Image.fromarray(cv2.cvtColor(merged, cv2.COLOR_LAB2RGB))
