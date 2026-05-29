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

    mask = Image.new("L", rgba.size, 0)
    draw = ImageDraw.Draw(mask)
    width, height = rgba.size

    if template.shape == "circular":
        draw.ellipse((0, 0, width, height), fill=255)
    elif template.shape == "oval":
        draw.ellipse((0, 0, width, height), fill=255)
    else:
        radius = template.border_radius if template.shape == "rounded" else 0
        draw.rounded_rectangle((0, 0, width, height), radius=radius, fill=255)

    rgba.putalpha(mask)
    return rgba
