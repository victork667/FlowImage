import cv2
import numpy as np
from PIL import Image


def apply_light_neutral_finish(image: Image.Image, target_luma: float = 184.5) -> Image.Image:
    """Keep badge photos clear while avoiding orange/warm color casts."""
    result = image.convert("RGB")
    result = lift_to_clear_luma(result, target_luma)
    result = neutralize_warm_cast(result)
    return apply_clear_contrast_detail(result)


def lift_to_clear_luma(image: Image.Image, target_luma: float = 184.5) -> Image.Image:
    arr = np.asarray(image).astype(np.float32)
    luma = _luma(arr)
    mask = _valid_analysis_mask(arr, luma)
    mean_luma = float(luma[mask].mean())

    max_lift = 0.26 if mean_luma < 95 else 0.225 if mean_luma < 145 else 0.09
    min_lift = 0.032 if mean_luma < 145 else 0.012
    lift = float(np.clip((target_luma - mean_luma) / 245, min_lift, max_lift))
    if mean_luma >= target_luma:
        lift = 0.006

    arr = arr + (255 - arr) * lift
    shadow_mask = luma < 118
    if shadow_mask.any():
        shadow_strength = 0.16 if mean_luma < 95 else 0.11
        arr[shadow_mask] += (118 - luma[shadow_mask])[..., None] * shadow_strength
    arr = _protect_highlights(arr)
    return Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))


def neutralize_warm_cast(image: Image.Image) -> Image.Image:
    arr = np.asarray(image.convert("RGB")).astype(np.float32)
    luma = _luma(arr)
    mask = _valid_analysis_mask(arr, luma)
    sample = arr[mask].reshape(-1, 3)
    red_mean, green_mean, blue_mean = sample.mean(axis=0)

    warm_gap = min(red_mean - blue_mean, green_mean - blue_mean)
    global_strength = float(np.clip((warm_gap - 3.0) / 34.0, 0.0, 1.0))

    if global_strength > 0:
        arr[..., 0] *= 1.0 - (0.075 * global_strength)
        arr[..., 1] *= 1.0 - (0.028 * global_strength)
        arr[..., 2] += (255 - arr[..., 2]) * (0.085 * global_strength)

    hsv = cv2.cvtColor(np.clip(arr, 0, 255).astype(np.uint8), cv2.COLOR_RGB2HSV).astype(np.float32)
    hue = hsv[..., 0]
    saturation = hsv[..., 1] / 255
    value = hsv[..., 2]
    orange_mask = (hue >= 6) & (hue <= 28) & (saturation > 0.24) & (value > 45) & (value < 245)
    if orange_mask.mean() > 0.06:
        local_strength = float(np.clip((orange_mask.mean() - 0.06) / 0.34, 0.0, 1.0))
        saturation_channel = hsv[..., 1]
        hue_channel = hsv[..., 0]
        saturation_channel[orange_mask] *= 1.0 - (0.22 * local_strength)
        hue_channel[orange_mask] = np.maximum(0, hue_channel[orange_mask] - (3.5 * local_strength))
        hsv[..., 1] = saturation_channel
        hsv[..., 0] = hue_channel
        arr = cv2.cvtColor(np.clip(hsv, 0, 255).astype(np.uint8), cv2.COLOR_HSV2RGB).astype(np.float32)

    arr = _cap_remaining_warm_gap(arr)
    return Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))


def apply_clear_contrast_detail(image: Image.Image) -> Image.Image:
    arr = np.asarray(image.convert("RGB")).astype(np.float32)
    luma_before = _luma(arr)
    mask = _valid_analysis_mask(arr, luma_before)
    mean_before = float(luma_before[mask].mean())

    lab = cv2.cvtColor(np.clip(arr, 0, 255).astype(np.uint8), cv2.COLOR_RGB2LAB)
    l_channel, a_channel, b_channel = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=1.35, tileGridSize=(8, 8))
    equalized = clahe.apply(l_channel).astype(np.float32)
    l_float = (l_channel.astype(np.float32) * 0.84) + (equalized * 0.16)
    mean_after = float(l_float[mask].mean())
    if mean_after < mean_before:
        l_float += mean_before - mean_after
    contrast_center = float(l_float[mask].mean())
    l_float = contrast_center + ((l_float - contrast_center) * 1.03)

    merged = cv2.merge((np.clip(l_float, 0, 255).astype(np.uint8), a_channel, b_channel))
    contrasted = cv2.cvtColor(merged, cv2.COLOR_LAB2RGB).astype(np.float32)
    blurred = cv2.GaussianBlur(contrasted, (0, 0), sigmaX=1.0, sigmaY=1.0)
    detailed = cv2.addWeighted(contrasted, 1.14, blurred, -0.14, 0)
    detailed_luma = _luma(detailed)
    detailed_mean = float(detailed_luma[mask].mean())
    if detailed_mean < mean_before:
        detailed += mean_before - detailed_mean
    detailed = _protect_highlights(detailed)
    return Image.fromarray(np.clip(detailed, 0, 255).astype(np.uint8))


def _luma(arr: np.ndarray) -> np.ndarray:
    return arr[..., 0] * 0.299 + arr[..., 1] * 0.587 + arr[..., 2] * 0.114


def _valid_analysis_mask(arr: np.ndarray, luma: np.ndarray) -> np.ndarray:
    hsv = cv2.cvtColor(np.clip(arr, 0, 255).astype(np.uint8), cv2.COLOR_RGB2HSV)
    saturation = hsv[..., 1].astype(np.float32) / 255
    mask = (luma > 18) & (luma < 242) & ~((luma > 220) & (saturation < 0.06))
    if mask.mean() < 0.12:
        return np.ones(mask.shape, dtype=bool)
    return mask


def _cap_remaining_warm_gap(arr: np.ndarray) -> np.ndarray:
    luma = _luma(arr)
    mask = _valid_analysis_mask(arr, luma)
    red_mean, _green_mean, blue_mean = arr[mask].reshape(-1, 3).mean(axis=0)
    warm_gap = red_mean - blue_mean
    if warm_gap <= 24:
        return arr

    excess = float(np.clip(warm_gap - 24, 0, 42))
    arr[..., 0] -= excess * 0.35
    arr[..., 1] -= excess * 0.08
    arr[..., 2] += excess * 0.55
    return arr


def _protect_highlights(arr: np.ndarray) -> np.ndarray:
    luma = _luma(arr)
    highlight_mask = luma > 226
    if highlight_mask.any():
        reduction = ((luma[highlight_mask] - 226) * 0.62)[..., None]
        arr[highlight_mask] -= reduction
    return arr
