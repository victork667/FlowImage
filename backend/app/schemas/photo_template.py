from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class PhotoTemplateBase(BaseModel):
    name: str = Field(min_length=2, max_length=140)
    description: str | None = None
    width: int = Field(default=600, ge=64, le=6000)
    height: int = Field(default=800, ge=64, le=6000)
    shape: str = Field(default="rectangular", pattern="^(rectangular|square|circular|oval|rounded)$")
    background_color: str = "#ffffff"
    transparent_background: bool = False
    border_radius: int = Field(default=0, ge=0, le=1000)
    output_format: str = Field(default="PNG", pattern="^(PNG|JPG|JPEG)$")
    output_quality: int = Field(default=92, ge=1, le=100)
    color_preset_id: int | None = None
    face_expand_x: float = Field(default=2.2, ge=0.5, le=8)
    face_expand_y: float = Field(default=2.8, ge=0.5, le=8)
    face_offset_y: float = Field(default=-0.15, ge=-2, le=2)
    zoom_default: float = Field(default=1.0, ge=0.2, le=5)
    offset_x_default: float = Field(default=0.0, ge=-3, le=3)
    offset_y_default: float = Field(default=0.0, ge=-3, le=3)
    head_top_margin: float = Field(default=0.12, ge=0, le=1)
    shoulder_visibility: float = Field(default=0.25, ge=0, le=1)
    crop_mode: str = "head_shoulders"
    status: str = Field(default="active", pattern="^(active|inactive)$")


class PhotoTemplateCreate(PhotoTemplateBase):
    pass


class PhotoTemplateUpdate(PhotoTemplateBase):
    pass


class PhotoTemplateRead(PhotoTemplateBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime
