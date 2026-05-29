from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import PhotoTemplate
from app.schemas.common import ApiMessage
from app.schemas.photo_template import PhotoTemplateCreate, PhotoTemplateRead, PhotoTemplateUpdate


router = APIRouter(prefix="/photo-templates", tags=["photo-templates"])


@router.get("", response_model=list[PhotoTemplateRead])
def list_templates(db: Session = Depends(get_db)) -> list[PhotoTemplate]:
    return db.query(PhotoTemplate).order_by(PhotoTemplate.created_at.desc()).all()


@router.post("", response_model=PhotoTemplateRead, status_code=status.HTTP_201_CREATED)
def create_template(payload: PhotoTemplateCreate, db: Session = Depends(get_db)) -> PhotoTemplate:
    template = PhotoTemplate(**payload.model_dump())
    db.add(template)
    db.commit()
    db.refresh(template)
    return template


@router.get("/{template_id}", response_model=PhotoTemplateRead)
def get_template(template_id: int, db: Session = Depends(get_db)) -> PhotoTemplate:
    template = db.get(PhotoTemplate, template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Molde não encontrado.")
    return template


@router.put("/{template_id}", response_model=PhotoTemplateRead)
def update_template(template_id: int, payload: PhotoTemplateUpdate, db: Session = Depends(get_db)) -> PhotoTemplate:
    template = db.get(PhotoTemplate, template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Molde não encontrado.")
    for key, value in payload.model_dump().items():
        setattr(template, key, value)
    db.commit()
    db.refresh(template)
    return template


@router.delete("/{template_id}", response_model=ApiMessage)
def delete_template(template_id: int, db: Session = Depends(get_db)) -> ApiMessage:
    template = db.get(PhotoTemplate, template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Molde não encontrado.")
    db.delete(template)
    db.commit()
    return ApiMessage(message="Molde excluído.")


@router.post("/{template_id}/duplicate", response_model=PhotoTemplateRead)
def duplicate_template(template_id: int, db: Session = Depends(get_db)) -> PhotoTemplate:
    template = db.get(PhotoTemplate, template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Molde não encontrado.")

    data = {
        column.name: getattr(template, column.name)
        for column in PhotoTemplate.__table__.columns
        if column.name not in {"id", "created_at", "updated_at"}
    }
    data["name"] = f"{template.name} (cópia)"
    duplicated = PhotoTemplate(**data)
    db.add(duplicated)
    db.commit()
    db.refresh(duplicated)
    return duplicated
