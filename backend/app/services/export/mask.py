from PIL import Image, ImageDraw

from app.models import PhotoTemplate


def background_rgba(template: PhotoTemplate) -> tuple[int, int, int, int]:
    if template.transparent_background or template.background_color == "transparent":
        return (255, 255, 255, 0)
    color = template.background_color.strip()
    if color.startswith("#") and len(color) in {4, 7}:
        if len(color) == 4:
            color = "#" + "".join(ch * 2 for ch in color[1:])
        return tuple(int(color[i : i + 2], 16) for i in (1, 3, 5)) + (255,)
    named = {
        "white": (255, 255, 255, 255),
        "black": (0, 0, 0, 255),
        "gray": (229, 231, 235, 255),
        "grey": (229, 231, 235, 255),
        "branco": (255, 255, 255, 255),
        "preto": (0, 0, 0, 255),
        "cinza": (229, 231, 235, 255),
    }
    return named.get(color.lower(), (255, 255, 255, 255))


def apply_shape_mask(image: Image.Image, template: PhotoTemplate) -> Image.Image:
    rgba = image.convert("RGBA")
    if template.shape in {"rectangular", "square"} and not template.border_radius:
        return rgba

    width, height = rgba.size
    mask = shape_mask(template, width, height)

    background = Image.new("RGBA", rgba.size, background_rgba(template))
    background.paste(rgba, (0, 0), mask)
    if template.transparent_background or template.background_color == "transparent":
        background.putalpha(mask)
    return background


def shape_mask(template: PhotoTemplate, width: int, height: int) -> Image.Image:
    scale = 4
    scaled_size = (width * scale, height * scale)
    mask = Image.new("L", scaled_size, 0)
    draw = ImageDraw.Draw(mask)
    box = (0, 0, scaled_size[0], scaled_size[1])
    if template.shape == "circular":
        diameter = min(scaled_size)
        left = (scaled_size[0] - diameter) // 2
        top = (scaled_size[1] - diameter) // 2
        draw.ellipse((left, top, left + diameter, top + diameter), fill=255)
    elif template.shape == "oval":
        draw.ellipse(box, fill=255)
    else:
        radius = effective_border_radius(template, width, height) * scale
        draw.rounded_rectangle(box, radius=radius, fill=255)
    return mask.resize((width, height), Image.Resampling.LANCZOS)


def effective_border_radius(template: PhotoTemplate, width: int, height: int) -> int:
    if template.border_radius > 0:
        return min(template.border_radius, min(width, height) // 2)
    if template.shape == "rounded":
        return max(8, min(width, height) // 10)
    return 0
