import shutil
import uuid
from pathlib import Path

from fastapi import UploadFile
from PIL import Image, ImageOps, UnidentifiedImageError

from app.core.config import get_settings


settings = get_settings()


def safe_stem(filename: str) -> str:
    stem = Path(filename).stem.lower().strip()
    safe = "".join(char if char.isalnum() else "_" for char in stem)
    return "_".join(part for part in safe.split("_") if part) or "foto"


def extension_for_format(output_format: str) -> str:
    return ".jpg" if output_format.upper() in {"JPG", "JPEG"} else ".png"


def unique_filename(original_name: str, suffix: str = "", extension: str | None = None) -> str:
    ext = extension if extension is not None else Path(original_name).suffix.lower()
    return f"{safe_stem(original_name)}{suffix}_{uuid.uuid4().hex[:8]}{ext}"


def save_upload(upload: UploadFile, target_dir: Path | None = None) -> Path:
    folder = target_dir or settings.input_dir
    folder.mkdir(parents=True, exist_ok=True)
    target = folder / unique_filename(upload.filename or "foto.jpg")
    with target.open("wb") as buffer:
        shutil.copyfileobj(upload.file, buffer)
    normalize_image_orientation(target)
    return target


def normalize_image_orientation(path: Path) -> None:
    try:
        with Image.open(path) as image:
            normalized = ImageOps.exif_transpose(image)
            if normalized.mode not in {"RGB", "RGBA"}:
                normalized = normalized.convert("RGB")
            save_kwargs = {"quality": 95} if path.suffix.lower() in {".jpg", ".jpeg"} else {}
            normalized.save(path, **save_kwargs)
    except (UnidentifiedImageError, OSError):
        return


def public_url(path: str | Path | None) -> str | None:
    if not path:
        return None
    file_path = Path(path)
    parent = file_path.parent.name
    if parent in {"input", "output", "debug"}:
        return f"/files/{parent}/{file_path.name}"
    return f"/files/output/{file_path.name}"
