import cv2
import numpy as np
from PIL import Image


def build_face_mesh_mask(image: Image.Image) -> np.ndarray | None:
    points = face_mesh_points(image)
    if points is None:
        return None

    source = image.convert("RGB")
    height, width = np.asarray(source).shape[:2]
    hull = cv2.convexHull(points)
    mask = np.zeros((height, width), dtype=np.uint8)
    cv2.fillConvexPoly(mask, hull, 255)

    kernel_size = max(9, int(min(width, height) * 0.045) | 1)
    mask = cv2.GaussianBlur(mask, (kernel_size, kernel_size), 0)
    normalized = mask.astype(np.float32) / 255
    return normalized if normalized.max() > 0 else None


def face_mesh_points(image: Image.Image) -> np.ndarray | None:
    try:
        import mediapipe as mp
    except Exception:
        return None

    source = image.convert("RGB")
    arr = np.asarray(source)
    height, width = arr.shape[:2]

    with mp.solutions.face_mesh.FaceMesh(
        static_image_mode=True,
        max_num_faces=1,
        refine_landmarks=True,
        min_detection_confidence=0.35,
    ) as face_mesh:
        results = face_mesh.process(arr)

    if not results.multi_face_landmarks:
        return None

    landmarks = results.multi_face_landmarks[0].landmark
    points = np.array(
        [
            [int(np.clip(point.x * width, 0, width - 1)), int(np.clip(point.y * height, 0, height - 1))]
            for point in landmarks
        ],
        dtype=np.int32,
    )
    if len(points) < 8:
        return None
    return points
