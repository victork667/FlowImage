from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class ColorPreset(Base, TimestampMixin):
    __tablename__ = "color_presets"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    brightness: Mapped[float] = mapped_column(Float, default=1.0)
    contrast: Mapped[float] = mapped_column(Float, default=1.0)
    saturation: Mapped[float] = mapped_column(Float, default=1.0)
    sharpness: Mapped[float] = mapped_column(Float, default=1.0)
    temperature: Mapped[float] = mapped_column(Float, default=0.0)
    auto_white_balance: Mapped[bool] = mapped_column(Boolean, default=True)
    shadow_reduction: Mapped[float] = mapped_column(Float, default=0.0)
    face_enhancement: Mapped[float] = mapped_column(Float, default=0.0)

    templates: Mapped[list["PhotoTemplate"]] = relationship(back_populates="color_preset")


class PhotoTemplate(Base, TimestampMixin):
    __tablename__ = "photo_templates"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(140), index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    width: Mapped[int] = mapped_column(Integer)
    height: Mapped[int] = mapped_column(Integer)
    shape: Mapped[str] = mapped_column(String(40), default="rectangular")
    background_color: Mapped[str] = mapped_column(String(40), default="#ffffff")
    transparent_background: Mapped[bool] = mapped_column(Boolean, default=False)
    border_radius: Mapped[int] = mapped_column(Integer, default=0)
    output_format: Mapped[str] = mapped_column(String(10), default="PNG")
    output_quality: Mapped[int] = mapped_column(Integer, default=92)
    color_preset_id: Mapped[int | None] = mapped_column(ForeignKey("color_presets.id"), nullable=True)
    face_expand_x: Mapped[float] = mapped_column(Float, default=2.2)
    face_expand_y: Mapped[float] = mapped_column(Float, default=2.8)
    face_offset_y: Mapped[float] = mapped_column(Float, default=-0.15)
    zoom_default: Mapped[float] = mapped_column(Float, default=1.0)
    offset_x_default: Mapped[float] = mapped_column(Float, default=0.0)
    offset_y_default: Mapped[float] = mapped_column(Float, default=0.0)
    head_top_margin: Mapped[float] = mapped_column(Float, default=0.12)
    shoulder_visibility: Mapped[float] = mapped_column(Float, default=0.25)
    crop_mode: Mapped[str] = mapped_column(String(40), default="head_shoulders")
    status: Mapped[str] = mapped_column(String(20), default="active")

    color_preset: Mapped[ColorPreset | None] = relationship(back_populates="templates")
    jobs: Mapped[list["PhotoJob"]] = relationship(back_populates="template")


class PhotoJob(Base, TimestampMixin):
    __tablename__ = "photo_jobs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    template_id: Mapped[int] = mapped_column(ForeignKey("photo_templates.id"))
    type: Mapped[str] = mapped_column(String(20), default="batch")
    status: Mapped[str] = mapped_column(String(30), default="created")
    total_items: Mapped[int] = mapped_column(Integer, default=0)
    processed_items: Mapped[int] = mapped_column(Integer, default=0)
    failed_items: Mapped[int] = mapped_column(Integer, default=0)

    template: Mapped[PhotoTemplate] = relationship(back_populates="jobs")
    items: Mapped[list["PhotoJobItem"]] = relationship(back_populates="job", cascade="all, delete-orphan")


class PhotoJobItem(Base, TimestampMixin):
    __tablename__ = "photo_job_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    job_id: Mapped[int] = mapped_column(ForeignKey("photo_jobs.id"))
    original_filename: Mapped[str] = mapped_column(String(255))
    original_photo_path: Mapped[str] = mapped_column(String(500))
    processed_photo_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    debug_face_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    debug_crop_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    face_detected: Mapped[bool] = mapped_column(Boolean, default=False)
    face_count: Mapped[int] = mapped_column(Integer, default=0)
    confidence: Mapped[float | None] = mapped_column(Float, nullable=True)
    manual_adjusted: Mapped[bool] = mapped_column(Boolean, default=False)
    status: Mapped[str] = mapped_column(String(30), default="uploaded")
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)

    job: Mapped[PhotoJob] = relationship(back_populates="items")
