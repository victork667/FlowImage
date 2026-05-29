import numpy as np
from PIL import Image, ImageDraw

from app.schemas.process import ManualAdjustments
from app.services.color_adjustment.adjust import apply_color_adjustments


def _sample_image() -> Image.Image:
    image = Image.new("RGB", (160, 180), (132, 126, 118))
    draw = ImageDraw.Draw(image)
    draw.rectangle((0, 0, 160, 55), fill=(54, 58, 68))
    draw.rectangle((0, 125, 160, 180), fill=(222, 220, 214))
    draw.ellipse((54, 48, 106, 110), fill=(176, 136, 112), outline=(80, 62, 52), width=2)
    draw.rectangle((62, 110, 98, 164), fill=(42, 74, 132))
    return image


def _rgb_mean(image: Image.Image) -> np.ndarray:
    return np.asarray(image.convert("RGB")).reshape(-1, 3).mean(axis=0)


def _luma(image: Image.Image) -> np.ndarray:
    arr = np.asarray(image.convert("RGB")).astype(np.float32)
    return arr[..., 0] * 0.299 + arr[..., 1] * 0.587 + arr[..., 2] * 0.114


def test_manual_shadow_reduction_has_visible_effect():
    source = _sample_image()
    neutral = apply_color_adjustments(source, None, ManualAdjustments(auto_white_balance=False, shadow_reduction=0, highlight_recovery=0, clarity=0, vibrance=0))
    lifted = apply_color_adjustments(source, None, ManualAdjustments(auto_white_balance=False, shadow_reduction=1, highlight_recovery=0, clarity=0, vibrance=0))

    assert float(_luma(lifted)[:55].mean()) > float(_luma(neutral)[:55].mean()) + 12


def test_manual_highlight_recovery_has_visible_effect():
    source = _sample_image()
    neutral = apply_color_adjustments(source, None, ManualAdjustments(auto_white_balance=False, shadow_reduction=0, highlight_recovery=0, clarity=0, vibrance=0))
    recovered = apply_color_adjustments(source, None, ManualAdjustments(auto_white_balance=False, shadow_reduction=0, highlight_recovery=1, clarity=0, vibrance=0))

    assert float(_luma(recovered)[125:].mean()) < float(_luma(neutral)[125:].mean()) - 8


def test_manual_temperature_changes_blue_red_balance_without_orange_cast():
    source = _sample_image()
    neutral = apply_color_adjustments(source, None, ManualAdjustments(auto_white_balance=False, temperature=0, shadow_reduction=0, highlight_recovery=0, clarity=0, vibrance=0))
    cool = apply_color_adjustments(source, None, ManualAdjustments(auto_white_balance=False, temperature=-45, shadow_reduction=0, highlight_recovery=0, clarity=0, vibrance=0))

    neutral_mean = _rgb_mean(neutral)
    cool_mean = _rgb_mean(cool)
    assert cool_mean[2] - cool_mean[0] > neutral_mean[2] - neutral_mean[0] + 22


def test_manual_detail_controls_have_visible_effect():
    source = _sample_image()
    neutral = apply_color_adjustments(source, None, ManualAdjustments(auto_white_balance=False, shadow_reduction=0, highlight_recovery=0, sharpness=1, clarity=0, vibrance=0))
    detailed = apply_color_adjustments(source, None, ManualAdjustments(auto_white_balance=False, shadow_reduction=0, highlight_recovery=0, sharpness=2.2, clarity=1, vibrance=0.8))

    assert np.asarray(detailed).std() > np.asarray(neutral).std() + 3
