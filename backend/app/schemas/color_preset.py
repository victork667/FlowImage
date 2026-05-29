from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ColorPresetBase(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    brightness: float = Field(default=1.0, ge=0.2, le=2.5)
    contrast: float = Field(default=1.0, ge=0.2, le=2.5)
    saturation: float = Field(default=1.0, ge=0.0, le=2.5)
    sharpness: float = Field(default=1.0, ge=0.0, le=3.0)
    temperature: float = Field(default=0.0, ge=-100.0, le=100.0)
    auto_white_balance: bool = True
    shadow_reduction: float = Field(default=0.0, ge=0.0, le=1.0)
    face_enhancement: float = Field(default=0.0, ge=0.0, le=1.0)


class ColorPresetCreate(ColorPresetBase):
    pass


class ColorPresetUpdate(ColorPresetBase):
    pass


class ColorPresetRead(ColorPresetBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime
