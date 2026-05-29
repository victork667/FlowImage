import cv2
import numpy as np
from PIL import Image, ImageEnhance

from app.services.color_adjustment.color_safety import apply_light_neutral_finish


def apply_adaptive_studio(image: Image.Image, face_mask: np.ndarray | None = None) -> Image.Image:
    """Apply a conservative studio-style correction based on the image itself."""
    result = image.convert("RGB")
    result = _gray_world_balance(result)

    arr = np.asarray(result)
    analysis_mask = _analysis_mask(arr)
    lab = cv2.cvtColor(arr, cv2.COLOR_RGB2LAB)
    l_channel, a_channel, b_channel = cv2.split(lab)
    l_float = l_channel.astype(np.float32)
    sampled_luma = l_float[analysis_mask]
    mean_luma = float(sampled_luma.mean())
    std_luma = float(sampled_luma.std())

    shadow_mask = l_float < 112
    lift_strength = float(np.clip((138 - mean_luma) / 180, 0.06, 0.24))
    if shadow_mask.any():
        l_float[shadow_mask] += (112 - l_float[shadow_mask]) * lift_strength

    highlight_mask = l_float > 226
    if highlight_mask.any():
        l_float[highlight_mask] -= (l_float[highlight_mask] - 226) * 0.12

    if std_luma < 52:
        clahe = cv2.createCLAHE(clipLimit=1.25, tileGridSize=(8, 8))
        equalized = clahe.apply(np.clip(l_float, 0, 255).astype(np.uint8)).astype(np.float32)
        l_float = (l_float * 0.7) + (equalized * 0.3)

    merged = cv2.merge((np.clip(l_float, 0, 255).astype(np.uint8), a_channel, b_channel))
    result = Image.fromarray(cv2.cvtColor(merged, cv2.COLOR_LAB2RGB))

    saturation = _mean_saturation(result, analysis_mask)
    brightness_factor = 1.08 if mean_luma < 130 else 0.97 if mean_luma > 212 else 1.02
    contrast_factor = 1.05 if std_luma < 46 else 1.02 if std_luma < 76 else 1.0
    saturation_factor = 1.04 if saturation < 0.28 else 0.92 if saturation > 0.55 else 0.98

    result = ImageEnhance.Brightness(result).enhance(brightness_factor)
    result = ImageEnhance.Contrast(result).enhance(contrast_factor)
    result = ImageEnhance.Color(result).enhance(saturation_factor)
    result = ImageEnhance.Sharpness(result).enhance(1.1)
    if face_mask is not None:
        result = _enhance_face_region(result, face_mask)
    return apply_light_neutral_finish(result)


def _gray_world_balance(image: Image.Image) -> Image.Image:
    arr = np.asarray(image).astype(np.float32)
    mask = _analysis_mask(arr.astype(np.uint8))
    avg = arr[mask].reshape(-1, 3).mean(axis=0)
    gray = avg.mean()
    gains = gray / np.maximum(avg, 1)
    adjusted = arr * (1 + (gains - 1) * 0.55)
    return Image.fromarray(np.clip(adjusted, 0, 255).astype(np.uint8))


def _mean_saturation(image: Image.Image, mask: np.ndarray) -> float:
    hsv = cv2.cvtColor(np.asarray(image), cv2.COLOR_RGB2HSV)
    return float(hsv[..., 1][mask].mean() / 255)


def _analysis_mask(arr: np.ndarray) -> np.ndarray:
    hsv = cv2.cvtColor(arr, cv2.COLOR_RGB2HSV)
    saturation = hsv[..., 1].astype(np.float32) / 255
    luma = (
        arr[..., 0].astype(np.float32) * 0.299
        + arr[..., 1].astype(np.float32) * 0.587
        + arr[..., 2].astype(np.float32) * 0.114
    )
    mask = ~(((luma > 242) & (saturation < 0.08)) | (luma < 14))
    if mask.mean() < 0.2:
        return np.ones(mask.shape, dtype=bool)
    return mask


def _enhance_face_region(image: Image.Image, face_mask: np.ndarray) -> Image.Image:
    if face_mask.shape != (image.height, image.width) or float(face_mask.max()) <= 0:
        return image

    arr = np.asarray(image)
    active = face_mask > 0.18
    if active.mean() < 0.01:
        return image

    lab = cv2.cvtColor(arr, cv2.COLOR_RGB2LAB)
    l_channel = lab[..., 0].astype(np.float32)
    face_luma = float(l_channel[active].mean())
    face_shadow = float((l_channel[active] < 112).mean())
    hsv = cv2.cvtColor(arr, cv2.COLOR_RGB2HSV)
    face_saturation = float(hsv[..., 1][active].mean() / 255)

    face = image
    brightness = 1.04 if face_luma < 132 else 0.97 if face_luma > 206 else 1.01
    contrast = 1.02 if face_luma < 190 else 1.0
    saturation = 1.02 if face_saturation < 0.34 else 0.94 if face_saturation > 0.58 else 0.98
    if face_shadow > 0.3:
        brightness += 0.03

    face = ImageEnhance.Brightness(face).enhance(brightness)
    face = ImageEnhance.Contrast(face).enhance(contrast)
    face = ImageEnhance.Color(face).enhance(saturation)
    face = ImageEnhance.Sharpness(face).enhance(1.08)

    alpha = Image.fromarray(np.clip(face_mask * 210, 0, 210).astype(np.uint8), mode="L")
    return Image.composite(face, image, alpha)
