import csv
import io
import zipfile
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.database import get_db
from app.models import PhotoJob, PhotoJobItem, PhotoTemplate
from app.schemas.common import ApiMessage
from app.schemas.job import PhotoJobCreate, PhotoJobItemRead, PhotoJobRead
from app.services.photo_processing.processor import process_photo
from app.storage.files import save_upload


router = APIRouter(prefix="/jobs", tags=["jobs"])
settings = get_settings()


@router.post("", response_model=PhotoJobRead)
def create_job(payload: PhotoJobCreate, db: Session = Depends(get_db)) -> PhotoJob:
    template = db.get(PhotoTemplate, payload.template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Molde nÃ£o encontrado.")
    job = PhotoJob(template_id=payload.template_id, type=payload.type, status="created")
    db.add(job)
    db.commit()
    db.refresh(job)
    return job


@router.post("/{job_id}/upload", response_model=list[PhotoJobItemRead])
def upload_job_files(
    job_id: int,
    files: list[UploadFile] = File(...),
    manifest: UploadFile | None = File(None),
    db: Session = Depends(get_db),
) -> list[PhotoJobItem]:
    raise HTTPException(status_code=410, detail="Upload persistente desativado. Use /api/process/*-file para processamento em memÃ³ria.")
    job = _get_job(db, job_id)
    target_dir = settings.input_dir / f"job_{job.id}"
    filename_map = _read_filename_manifest(manifest)
    items = []
    for upload in files:
        path = save_upload(upload, target_dir)
        source_name = upload.filename or path.name
        item = PhotoJobItem(
            job_id=job.id,
            original_filename=filename_map.get(source_name, source_name),
            original_photo_path=str(path),
            status="uploaded",
        )
        db.add(item)
        items.append(item)
    job.total_items += len(items)
    job.status = "uploaded"
    db.commit()
    return db.query(PhotoJobItem).filter(PhotoJobItem.job_id == job.id).order_by(PhotoJobItem.id.asc()).all()


@router.post("/{job_id}/process", response_model=PhotoJobRead)
def process_job(job_id: int, db: Session = Depends(get_db)) -> PhotoJob:
    raise HTTPException(status_code=410, detail="Processamento persistente desativado. O lote atual processa em memÃ³ria no frontend.")
    job = _get_job(db, job_id)
    template = _get_template(db, job.template_id)
    items = db.query(PhotoJobItem).filter(PhotoJobItem.job_id == job.id).order_by(PhotoJobItem.id.asc()).all()
    job.status = "processing"
    db.commit()

    for item in items:
        result = process_photo(db, Path(item.original_photo_path), item.original_filename, template)
        _apply_result_to_item(item, result)
        db.commit()

    _recount_job(db, job)
    db.refresh(job)
    return job


@router.post("/{job_id}/items/{item_id}/reprocess", response_model=PhotoJobItemRead)
def reprocess_job_item(job_id: int, item_id: int, db: Session = Depends(get_db)) -> PhotoJobItem:
    raise HTTPException(status_code=410, detail="Reprocessamento persistente desativado.")
    return _process_single_item(job_id, item_id, "_reprocessada", db)


@router.post("/{job_id}/items/{item_id}/process", response_model=PhotoJobItemRead)
def process_job_item(job_id: int, item_id: int, db: Session = Depends(get_db)) -> PhotoJobItem:
    raise HTTPException(status_code=410, detail="Processamento persistente desativado.")
    return _process_single_item(job_id, item_id, "_cracha", db)


def _process_single_item(job_id: int, item_id: int, filename_suffix: str, db: Session) -> PhotoJobItem:
    job = _get_job(db, job_id)
    item = db.get(PhotoJobItem, item_id)
    if not item or item.job_id != job.id:
        raise HTTPException(status_code=404, detail="Item nÃ£o encontrado.")
    template = _get_template(db, job.template_id)
    result = process_photo(db, Path(item.original_photo_path), item.original_filename, template, filename_suffix=filename_suffix)
    _apply_result_to_item(item, result)
    db.commit()
    db.refresh(item)
    _recount_job(db, job)
    return item


@router.get("/{job_id}", response_model=PhotoJobRead)
def get_job(job_id: int, db: Session = Depends(get_db)) -> PhotoJob:
    return _get_job(db, job_id)


@router.get("/{job_id}/items", response_model=list[PhotoJobItemRead])
def get_job_items(job_id: int, db: Session = Depends(get_db)) -> list[PhotoJobItem]:
    _get_job(db, job_id)
    return db.query(PhotoJobItem).filter(PhotoJobItem.job_id == job_id).order_by(PhotoJobItem.id.asc()).all()


@router.get("/{job_id}/export-zip")
@router.post("/{job_id}/export-zip")
def export_job_zip(job_id: int, db: Session = Depends(get_db)) -> FileResponse:
    raise HTTPException(status_code=410, detail="ZIP persistente desativado. O ZIP agora Ã© montado no navegador.")
    job = _get_job(db, job_id)
    items = db.query(PhotoJobItem).filter(PhotoJobItem.job_id == job.id, PhotoJobItem.processed_photo_path.is_not(None)).all()
    if not items:
        raise HTTPException(status_code=400, detail="Nenhuma imagem processada para exportar.")

    zip_path = settings.output_dir / f"flowimage_job_{job.id}.zip"
    with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        for item in items:
            file_path = Path(item.processed_photo_path or "")
            if file_path.exists():
                archive.write(file_path, arcname=file_path.name)
    return FileResponse(zip_path, filename=zip_path.name, media_type="application/zip")


@router.delete("/{job_id}", response_model=ApiMessage)
def delete_job(job_id: int, db: Session = Depends(get_db)) -> ApiMessage:
    job = _get_job(db, job_id)
    db.delete(job)
    db.commit()
    return ApiMessage(message="Job excluÃ­do.")


def _get_job(db: Session, job_id: int) -> PhotoJob:
    job = db.get(PhotoJob, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job nÃ£o encontrado.")
    return job


def _get_template(db: Session, template_id: int) -> PhotoTemplate:
    template = db.get(PhotoTemplate, template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Molde nÃ£o encontrado.")
    return template


def _apply_result_to_item(item: PhotoJobItem, result) -> None:
    item.processed_photo_path = result.processed_photo_path
    item.debug_face_path = _url_to_path(result.debug_face_url)
    item.debug_crop_path = _url_to_path(result.debug_crop_url)
    item.face_detected = result.detection.face_detected
    item.face_count = result.detection.face_count
    item.confidence = result.detection.confidence
    item.status = result.status
    item.error_message = result.error_message


def _recount_job(db: Session, job: PhotoJob) -> None:
    items = db.query(PhotoJobItem).filter(PhotoJobItem.job_id == job.id).all()
    job.total_items = len(items)
    job.processed_items = sum(1 for item in items if item.status == "processed")
    job.failed_items = sum(1 for item in items if item.status not in {"processed", "uploaded"})
    job.status = "completed_with_errors" if job.failed_items else "completed"
    db.commit()


def _read_filename_manifest(manifest: UploadFile | None) -> dict[str, str]:
    if not manifest:
        return {}
    content = manifest.file.read().decode("utf-8-sig", errors="ignore")
    rows = csv.DictReader(io.StringIO(content))
    mapping: dict[str, str] = {}
    for row in rows:
        original = (row.get("original_filename") or row.get("arquivo") or row.get("original") or "").strip()
        output = (row.get("output_name") or row.get("nome_saida") or row.get("nome") or "").strip()
        if original and output:
            mapping[original] = output
    return mapping


def _url_to_path(url: str | None) -> str | None:
    if not url:
        return None
    name = url.rstrip("/").split("/")[-1]
    if "/debug/" in url:
        return str(settings.debug_dir / name)
    if "/output/" in url:
        return str(settings.output_dir / name)
    return None
