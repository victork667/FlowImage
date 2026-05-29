from pydantic import BaseModel, Field


class ManualAdjustments(BaseModel):
    studio_auto: bool = True
    enhance_quality: bool = False
    zoom: float = Field(default=1.0, ge=0.2, le=5)
    offset_x: float = Field(default=0.0, ge=-3, le=3)
    offset_y: float = Field(default=0.0, ge=-3, le=3)
    rotation: float = Field(default=0.0, ge=-20, le=20)
    brightness: float | None = Field(default=None, ge=0.2, le=2.5)
    contrast: float | None = Field(default=None, ge=0.2, le=2.5)
    saturation: float | None = Field(default=None, ge=0.0, le=2.5)
    sharpness: float | None = Field(default=None, ge=0.0, le=3.0)
    temperature: float = Field(default=0.0, ge=-60.0, le=12.0)
    auto_white_balance: bool = True
    shadow_reduction: float = Field(default=0.18, ge=0.0, le=1.0)
    highlight_recovery: float = Field(default=0.12, ge=0.0, le=1.0)
    gamma: float = Field(default=1.0, ge=0.65, le=1.45)
    clarity: float = Field(default=0.12, ge=0.0, le=1.0)
    vibrance: float = Field(default=0.04, ge=-0.5, le=0.8)
    color_preset_id: int | None = None


class DetectionInfo(BaseModel):
    face_detected: bool
    face_count: int
    confidence: float | None
    bounding_box: dict[str, float] | None
    center: dict[str, float] | None
    face_width: float | None
    face_height: float | None
    detector: str


class QualityInfo(BaseModel):
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


class AnalyzeResult(BaseModel):
    detection: DetectionInfo
    quality: QualityInfo


class ProcessResult(BaseModel):
    status: str
    filename: str | None = None
    download_url: str | None = None
    processed_photo_path: str | None = None
    debug_face_url: str | None = None
    debug_crop_url: str | None = None
    detection: DetectionInfo
    error_message: str | None = None
