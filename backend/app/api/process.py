import json
from io import BytesIO

from PIL import Image, ImageOps
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import PhotoTemplate
from app.schemas.process import AnalyzeResult, DetectionInfo, ManualAdjustments, QualityInfo
from app.services.face_detection.detector import DetectionResult, detect_faces_from_pil
from app.services.photo_analysis.quality import QualityAnalysis, analyze_photo_quality
from app.services.photo_processing.memory_processor import process_image_bytes


router = APIRouter(prefix="/process", tags=["process"])


@router.post("/single-file")
async def process_single_file(
    template_id: int = Form(...),
    file: UploadFile = File(...),
    filename_suffix: str = Form(""),
    smart_studio: bool = Form(True),
    enhance_quality: bool = Form(False),
    db: Session = Depends(get_db),
) -> StreamingResponse:
    template = _get_template(db, template_id)
    result = process_image_bytes(
        db,
        await file.read(),
        file.filename or "foto",
        template,
        filename_suffix=filename_suffix,
        studio_auto=smart_studio,
        enhance_quality=enhance_quality,
    )
    return _image_response(result.content, result.filename, result.media_type)


@router.post("/analyze-file", response_model=AnalyzeResult)
async def analyze_file(file: UploadFile = File(...)) -> AnalyzeResult:
    source = ImageOps.exif_transpose(Image.open(BytesIO(await file.read()))).convert("RGB")
    detection = detect_faces_from_pil(source)
    quality = analyze_photo_quality(source, detection)
    return AnalyzeResult(detection=_detection_info(detection), quality=_quality_info(quality))


@router.post("/preview-file")
async def process_preview_file(
    template_id: int = Form(...),
    adjustments: str | None = Form(None),
    file: UploadFile = File(...),
    smart_studio: bool = Form(True),
    enhance_quality: bool = Form(False),
    db: Session = Depends(get_db),
) -> StreamingResponse:
    template = _get_template(db, template_id)
    result = process_image_bytes(
        db,
        await file.read(),
        file.filename or "foto",
        template,
        _parse_adjustments(adjustments),
        filename_suffix="_preview",
        studio_auto=smart_studio,
        enhance_quality=enhance_quality,
    )
    return _image_response(result.content, result.filename, result.media_type)


@router.post("/manual-adjust-file")
async def manual_adjust_file(
    template_id: int = Form(...),
    adjustments: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
) -> StreamingResponse:
    template = _get_template(db, template_id)
    result = process_image_bytes(
        db,
        await file.read(),
        file.filename or "foto",
        template,
        _parse_adjustments(adjustments),
        filename_suffix="",
    )
    return _image_response(result.content, result.filename, result.media_type)


def _get_template(db: Session, template_id: int) -> PhotoTemplate:
    template = db.get(PhotoTemplate, template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Molde nÃ£o encontrado.")
    return template


def _parse_adjustments(raw: str | None) -> ManualAdjustments | None:
    if not raw:
        return None
    try:
        return ManualAdjustments.model_validate(json.loads(raw))
    except Exception as exc:
        raise HTTPException(status_code=422, detail="Ajustes manuais invÃ¡lidos.") from exc


def _image_response(content: bytes, filename: str, media_type: str) -> StreamingResponse:
    return StreamingResponse(
        BytesIO(content),
        media_type=media_type,
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "X-Filename": filename,
        },
    )


def _detection_info(detection: DetectionResult) -> DetectionInfo:
    face = detection.selected_face
    return DetectionInfo(
        face_detected=bool(face),
        face_count=detection.face_count,
        confidence=face.confidence if face else None,
        bounding_box={"x": face.x, "y": face.y, "width": face.width, "height": face.height} if face else None,
        center={"x": face.center_x, "y": face.center_y} if face else None,
        face_width=face.width if face else None,
        face_height=face.height if face else None,
        detector=detection.detector,
    )


def _quality_info(quality: QualityAnalysis) -> QualityInfo:
    return QualityInfo(
        score=quality.score,
        status=quality.status,
        width=quality.width,
        height=quality.height,
        brightness=quality.brightness,
        blur_score=quality.blur_score,
        face_ratio=quality.face_ratio,
        face_mesh_detected=quality.face_mesh_detected,
        needs_review=quality.needs_review,
        warnings=quality.warnings,
        suggestions=quality.suggestions,
    )
