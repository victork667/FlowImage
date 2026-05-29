from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import ColorPreset
from app.schemas.common import ApiMessage
from app.schemas.color_preset import ColorPresetCreate, ColorPresetRead, ColorPresetUpdate


router = APIRouter(prefix="/color-presets", tags=["color-presets"])


@router.get("", response_model=list[ColorPresetRead])
def list_presets(db: Session = Depends(get_db)) -> list[ColorPreset]:
    return db.query(ColorPreset).order_by(ColorPreset.name.asc()).all()


@router.post("", response_model=ColorPresetRead, status_code=status.HTTP_201_CREATED)
def create_preset(payload: ColorPresetCreate, db: Session = Depends(get_db)) -> ColorPreset:
    preset = ColorPreset(**payload.model_dump())
    db.add(preset)
    db.commit()
    db.refresh(preset)
    return preset


@router.put("/{preset_id}", response_model=ColorPresetRead)
def update_preset(preset_id: int, payload: ColorPresetUpdate, db: Session = Depends(get_db)) -> ColorPreset:
    preset = db.get(ColorPreset, preset_id)
    if not preset:
        raise HTTPException(status_code=404, detail="Preset não encontrado.")
    for key, value in payload.model_dump().items():
        setattr(preset, key, value)
    db.commit()
    db.refresh(preset)
    return preset


@router.delete("/{preset_id}", response_model=ApiMessage)
def delete_preset(preset_id: int, db: Session = Depends(get_db)) -> ApiMessage:
    preset = db.get(ColorPreset, preset_id)
    if not preset:
        raise HTTPException(status_code=404, detail="Preset não encontrado.")
    db.delete(preset)
    db.commit()
    return ApiMessage(message="Preset excluído.")
