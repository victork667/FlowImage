import cv2
import numpy as np
from PIL import Image


def resize_with_safe_upscale(image: Image.Image, size: tuple[int, int]) -> Image.Image:
    source = image.convert("RGB")
    target_width, target_height = size
    if target_width <= 0 or target_height <= 0:
        return source

    resized = _progressive_resize(source, size)
    return _enhance_pixel_quality(resized, source.size, size)


def _progressive_resize(image: Image.Image, size: tuple[int, int]) -> Image.Image:
    arr = np.asarray(image)
    target_width, target_height = size
    scale = max(target_width / max(1, image.width), target_height / max(1, image.height))

    if scale <= 1:
        resized = cv2.resize(arr, (target_width, target_height), interpolation=cv2.INTER_AREA)
        return Image.fromarray(resized)

    current = arr
    current_width, current_height = image.width, image.height
    while max(target_width / current_width, target_height / current_height) > 1.75:
        next_width = min(target_width, int(round(current_width * 1.55)))
        next_height = min(target_height, int(round(current_height * 1.55)))
        current = cv2.resize(current, (next_width, next_height), interpolation=cv2.INTER_CUBIC)
        current_width, current_height = next_width, next_height

    resized = cv2.resize(current, (target_width, target_height), interpolation=cv2.INTER_LANCZOS4)
    return Image.fromarray(resized)


def _enhance_pixel_quality(image: Image.Image, source_size: tuple[int, int], target_size: tuple[int, int]) -> Image.Image:
    arr = np.asarray(image.convert("RGB")).astype(np.uint8)
    if arr.size == 0:
        return image.convert("RGB")

    upscale_factor = max(
        target_size[0] / max(1, source_size[0]),
        target_size[1] / max(1, source_size[1]),
    )
    luma = cv2.cvtColor(arr, cv2.COLOR_RGB2GRAY)
    blur_score = float(cv2.Laplacian(luma, cv2.CV_64F).var())
    noise_score = _estimate_noise(luma)

    if upscale_factor > 1.08 or noise_score > 5.5:
        arr = _reduce_pixel_noise(arr, noise_score, upscale_factor)

    arr = _sharpen_luminance_edges(arr, blur_score, upscale_factor)
    arr = _soften_compression_chroma(arr, upscale_factor, noise_score)
    return Image.fromarray(arr)


def _estimate_noise(luma: np.ndarray) -> float:
    median = cv2.medianBlur(luma, 3)
    residual = luma.astype(np.float32) - median.astype(np.float32)
    return float(np.median(np.abs(residual)))


def _reduce_pixel_noise(arr: np.ndarray, noise_score: float, upscale_factor: float) -> np.ndarray:
    strength = 2.2
    if noise_score > 9:
        strength = 4.0
    elif noise_score > 6:
        strength = 3.0
    if upscale_factor > 1.7:
        strength += 0.7
    return cv2.fastNlMeansDenoisingColored(arr, None, h=strength, hColor=strength + 1.2, templateWindowSize=5, searchWindowSize=15)


def _sharpen_luminance_edges(arr: np.ndarray, blur_score: float, upscale_factor: float) -> np.ndarray:
    lab = cv2.cvtColor(arr, cv2.COLOR_RGB2LAB)
    l_channel, a_channel, b_channel = cv2.split(lab)
    l_float = l_channel.astype(np.float32)

    sigma = 0.9 if upscale_factor <= 1.4 else 1.15
    blurred = cv2.GaussianBlur(l_float, (0, 0), sigmaX=sigma, sigmaY=sigma)
    detail = l_float - blurred

    gradient_x = cv2.Sobel(l_float, cv2.CV_32F, 1, 0, ksize=3)
    gradient_y = cv2.Sobel(l_float, cv2.CV_32F, 0, 1, ksize=3)
    gradient = cv2.magnitude(gradient_x, gradient_y)
    edge_weight = np.clip((gradient - 6.0) / 42.0, 0.0, 1.0)
    detail_weight = np.clip((np.abs(detail) - 1.8) / 18.0, 0.0, 1.0)

    amount = 0.18
    if blur_score < 70:
        amount = 0.42
    elif blur_score < 150:
        amount = 0.34
    elif upscale_factor > 1.25:
        amount = 0.30
    if upscale_factor > 1.8:
        amount += 0.08
    amount = min(amount, 0.52)

    enhanced_l = l_float + (detail * amount * np.maximum(edge_weight, detail_weight * 0.55))
    enhanced_l = _limit_luma_shift(l_float, enhanced_l, max_shift=10.0 if upscale_factor <= 1.2 else 14.0)
    merged = cv2.merge((np.clip(enhanced_l, 0, 255).astype(np.uint8), a_channel, b_channel))
    return cv2.cvtColor(merged, cv2.COLOR_LAB2RGB)


def _limit_luma_shift(original: np.ndarray, adjusted: np.ndarray, max_shift: float) -> np.ndarray:
    delta = np.clip(adjusted - original, -max_shift, max_shift)
    highlights = original > 232
    shadows = original < 18
    delta[highlights] = np.minimum(delta[highlights], 2.0)
    delta[shadows] = np.maximum(delta[shadows], -2.0)
    return original + delta


def _soften_compression_chroma(arr: np.ndarray, upscale_factor: float, noise_score: float) -> np.ndarray:
    if upscale_factor <= 1.05 and noise_score <= 4.5:
        return arr
    lab = cv2.cvtColor(arr, cv2.COLOR_RGB2LAB)
    l_channel, a_channel, b_channel = cv2.split(lab)
    a_smooth = cv2.bilateralFilter(a_channel, 5, 9, 9)
    b_smooth = cv2.bilateralFilter(b_channel, 5, 9, 9)
    blend = 0.22 if upscale_factor > 1.4 or noise_score > 7 else 0.14
    a_channel = cv2.addWeighted(a_channel, 1.0 - blend, a_smooth, blend, 0)
    b_channel = cv2.addWeighted(b_channel, 1.0 - blend, b_smooth, blend, 0)
    return cv2.cvtColor(cv2.merge((l_channel, a_channel, b_channel)), cv2.COLOR_LAB2RGB)
