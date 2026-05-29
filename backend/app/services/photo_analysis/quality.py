from dataclasses import dataclass

import cv2
import numpy as np
from PIL import Image

from app.services.face_detection.detector import DetectionResult

@dataclass
class QualityAnalysis:
    score: int
    status: str
    width: int
    height: int
    brightness: float
    blur_score: float
    face_ratio: float | None
    face_mesh_detected: bool
    needs_review: bool
    warnings: list[str]
    suggestions: list[str]


def analyze_photo_quality(image: Image.Image, detection: DetectionResult) -> QualityAnalysis:
    source = image.convert("RGB")
    arr = np.asarray(source)
    gray = cv2.cvtColor(arr, cv2.COLOR_RGB2GRAY)
    brightness = float(gray.mean())
    blur_score = float(cv2.Laplacian(gray, cv2.CV_64F).var())
    face_ratio = _face_ratio(source, detection)
    face_mesh_detected = False

    warnings: list[str] = []
    suggestions: list[str] = []
    score = 100

    if min(source.size) < 500:
        score -= 22
        warnings.append("Imagem pequena")
        suggestions.append("Use Melhorar pixels apenas neste caso ou envie uma foto maior.")
    if blur_score < 60:
        score -= 28
        warnings.append("Imagem borrada")
        suggestions.append("Troque por uma foto mais nitida.")
    elif blur_score < 120:
        score -= 12
        warnings.append("Nitidez baixa")
    if brightness < 72:
        score -= 18
        warnings.append("Imagem escura")
        suggestions.append("Ative Studio automatico ou ajuste brilho na revisao.")
    elif brightness > 218:
        score -= 14
        warnings.append("Imagem muito clara")
    if not detection.selected_face:
        score -= 35
        warnings.append("Rosto nao detectado")
        suggestions.append("Enviar uma foto com rosto frontal ou revisar manualmente.")
    elif face_ratio is not None:
        if face_ratio < 0.018:
            score -= 22
            warnings.append("Rosto muito pequeno")
            suggestions.append("Use foto mais proxima ou revise o enquadramento.")
        elif face_ratio > 0.38:
            score -= 10
            warnings.append("Rosto muito proximo")
        if not _face_inside_safe_area(source, detection):
            score -= 18
            warnings.append("Rosto perto da borda")
            suggestions.append("Use uma foto com mais margem ao redor da cabeca.")
    score = int(max(0, min(100, score)))
    status = "ok" if score >= 78 else "review" if score >= 52 else "problem"
    return QualityAnalysis(
        score=score,
        status=status,
        width=source.width,
        height=source.height,
        brightness=round(brightness, 2),
        blur_score=round(blur_score, 2),
        face_ratio=round(face_ratio, 4) if face_ratio is not None else None,
        face_mesh_detected=face_mesh_detected,
        needs_review=status != "ok",
        warnings=warnings,
        suggestions=suggestions,
    )


def _face_ratio(image: Image.Image, detection: DetectionResult) -> float | None:
    face = detection.selected_face
    if not face:
        return None
    return face.area / max(1, image.width * image.height)


def _face_inside_safe_area(image: Image.Image, detection: DetectionResult) -> bool:
    face = detection.selected_face
    if not face:
        return False
    margin_x = image.width * 0.04
    margin_y = image.height * 0.04
    return (
        face.x >= margin_x
        and face.y >= margin_y
        and face.x + face.width <= image.width - margin_x
        and face.y + face.height <= image.height - margin_y
    )
