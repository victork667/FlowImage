from dataclasses import dataclass
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageOps


@dataclass
class FaceBox:
    x: float
    y: float
    width: float
    height: float
    confidence: float

    @property
    def area(self) -> float:
        return self.width * self.height

    @property
    def center_x(self) -> float:
        return self.x + self.width / 2

    @property
    def center_y(self) -> float:
        return self.y + self.height / 2


@dataclass
class DetectionResult:
    face_detected: bool
    face_count: int
    selected_face: FaceBox | None
    detector: str


def detect_faces(image_path: Path) -> DetectionResult:
    image = read_image_bgr(image_path)
    if image is None:
        return DetectionResult(False, 0, None, "none")

    mediapipe_result = _detect_with_mediapipe(image)
    if mediapipe_result.face_detected:
        return mediapipe_result

    return _detect_with_opencv(image)


def detect_faces_from_pil(source: Image.Image) -> DetectionResult:
    normalized = ImageOps.exif_transpose(source).convert("RGB")
    image = cv2.cvtColor(np.asarray(normalized), cv2.COLOR_RGB2BGR)
    mediapipe_result = _detect_with_mediapipe(image)
    if mediapipe_result.face_detected:
        return mediapipe_result
    return _detect_with_opencv(image)


def read_image_bgr(image_path: Path) -> np.ndarray | None:
    try:
        with Image.open(image_path) as source:
            normalized = ImageOps.exif_transpose(source).convert("RGB")
            return cv2.cvtColor(np.asarray(normalized), cv2.COLOR_RGB2BGR)
    except Exception:
        return None


def _detect_with_mediapipe(image: np.ndarray) -> DetectionResult:
    try:
        import mediapipe as mp
    except Exception:
        return DetectionResult(False, 0, None, "mediapipe_unavailable")

    faces: list[FaceBox] = []

    for model_selection in (0, 1):
        for scale in _detection_scales(image):
            scaled = image if scale == 1.0 else cv2.resize(image, None, fx=scale, fy=scale, interpolation=cv2.INTER_CUBIC)
            height, width = scaled.shape[:2]
            rgb = cv2.cvtColor(scaled, cv2.COLOR_BGR2RGB)
            with mp.solutions.face_detection.FaceDetection(
                model_selection=model_selection,
                min_detection_confidence=0.32,
            ) as detector:
                results = detector.process(rgb)
                for detection in results.detections or []:
                    box = detection.location_data.relative_bounding_box
                    confidence = float(detection.score[0]) if detection.score else 0.0
                    faces.append(
                        FaceBox(
                            x=max(0.0, box.xmin * width) / scale,
                            y=max(0.0, box.ymin * height) / scale,
                            width=max(1.0, box.width * width) / scale,
                            height=max(1.0, box.height * height) / scale,
                            confidence=confidence,
                        )
                    )

    selected = max(faces, key=lambda face: face.area) if faces else None
    return DetectionResult(bool(selected), len(faces), selected, "mediapipe_multi")


def _detect_with_opencv(image: np.ndarray) -> DetectionResult:
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    equalized = cv2.equalizeHist(gray)
    faces: list[FaceBox] = []
    cascade_names = ["haarcascade_frontalface_default.xml", "haarcascade_frontalface_alt2.xml", "haarcascade_profileface.xml"]
    for cascade_name in cascade_names:
        cascade = cv2.CascadeClassifier(str(Path(cv2.data.haarcascades) / cascade_name))
        for source in (gray, equalized):
            detected = cascade.detectMultiScale(source, scaleFactor=1.05, minNeighbors=4, minSize=(32, 32))
            faces.extend(FaceBox(float(x), float(y), float(w), float(h), 0.5) for x, y, w, h in detected)
    selected = max(faces, key=lambda face: face.area) if faces else None
    return DetectionResult(bool(selected), len(faces), selected, "opencv_haar_multi")


def save_face_debug(image_path: Path, detection: DetectionResult, output_path: Path) -> None:
    image = ImageOps.exif_transpose(Image.open(image_path)).convert("RGB")
    draw = ImageDraw.Draw(image)
    if detection.selected_face:
        face = detection.selected_face
        draw.rectangle((face.x, face.y, face.x + face.width, face.y + face.height), outline="#00c853", width=5)
        draw.text((face.x, max(0, face.y - 24)), f"{detection.detector} {face.confidence:.2f}", fill="#00c853")
    image.save(output_path, quality=92)


def _detection_scales(image: np.ndarray) -> list[float]:
    height, width = image.shape[:2]
    shortest = min(height, width)
    if shortest < 360:
        return [1.0, 2.0, 2.8]
    if shortest < 720:
        return [1.0, 1.5]
    return [1.0]
