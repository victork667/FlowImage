from datetime import datetime

from pydantic import BaseModel, ConfigDict, computed_field


class PhotoJobCreate(BaseModel):
    template_id: int
    type: str = "batch"


class PhotoJobRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    template_id: int
    type: str
    status: str
    total_items: int
    processed_items: int
    failed_items: int
    created_at: datetime
    updated_at: datetime


class PhotoJobItemRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    job_id: int
    original_filename: str
    original_photo_path: str
    processed_photo_path: str | None
    debug_face_path: str | None
    debug_crop_path: str | None
    face_detected: bool
    face_count: int
    confidence: float | None
    manual_adjusted: bool
    status: str
    error_message: str | None
    created_at: datetime
    updated_at: datetime

    @computed_field
    @property
    def original_url(self) -> str | None:
        if not self.original_photo_path:
            return None
        normalized = self.original_photo_path.replace("\\", "/")
        parts = normalized.split("/")
        filename = parts[-1]
        parent = parts[-2] if len(parts) > 1 and parts[-2].startswith("job_") else ""
        return f"/files/input/{parent}/{filename}" if parent else f"/files/input/{filename}"

    @computed_field
    @property
    def download_url(self) -> str | None:
        if not self.processed_photo_path:
            return None
        normalized = self.processed_photo_path.replace("\\", "/")
        return f"/files/output/{normalized.split('/')[-1]}"
