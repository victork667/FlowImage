from sqlalchemy.orm import Session

from app.models import ColorPreset, PhotoTemplate


DEFAULT_PRESETS = [
    {
        "name": "Natural",
        "brightness": 1.02,
        "contrast": 1.04,
        "saturation": 1.02,
        "sharpness": 1.05,
        "temperature": 0,
        "auto_white_balance": True,
        "shadow_reduction": 0.15,
        "face_enhancement": 0.15,
    },
    {
        "name": "Documento",
        "brightness": 1.08,
        "contrast": 1.12,
        "saturation": 0.96,
        "sharpness": 1.18,
        "temperature": -3,
        "auto_white_balance": True,
        "shadow_reduction": 0.22,
        "face_enhancement": 0.1,
    },
    {
        "name": "Crachá Claro",
        "brightness": 1.12,
        "contrast": 1.08,
        "saturation": 1.04,
        "sharpness": 1.1,
        "temperature": 2,
        "auto_white_balance": True,
        "shadow_reduction": 0.28,
        "face_enhancement": 0.18,
    },
    {
        "name": "Crachá Forte",
        "brightness": 1.06,
        "contrast": 1.2,
        "saturation": 1.1,
        "sharpness": 1.22,
        "temperature": 0,
        "auto_white_balance": True,
        "shadow_reduction": 0.18,
        "face_enhancement": 0.22,
    },
    {
        "name": "Pele Natural",
        "brightness": 1.04,
        "contrast": 1.03,
        "saturation": 1.08,
        "sharpness": 1.04,
        "temperature": 5,
        "auto_white_balance": True,
        "shadow_reduction": 0.2,
        "face_enhancement": 0.25,
    },
]


def seed_defaults(db: Session) -> None:
    if db.query(ColorPreset).count() == 0:
        db.add_all(ColorPreset(**preset) for preset in DEFAULT_PRESETS)
        db.commit()

    if db.query(PhotoTemplate).count() == 0:
        natural = db.query(ColorPreset).filter(ColorPreset.name == "Natural").first()
        document = db.query(ColorPreset).filter(ColorPreset.name == "Documento").first()
        templates = [
            PhotoTemplate(
                name="Foto 3x4 vertical",
                description="Foto vertical com cabeça e ombros para crachá.",
                width=600,
                height=800,
                shape="rectangular",
                background_color="#ffffff",
                output_format="PNG",
                color_preset_id=document.id if document else None,
            ),
            PhotoTemplate(
                name="Foto quadrada",
                description="Foto quadrada pronta para sistemas que recortam avatar.",
                width=1000,
                height=1000,
                shape="square",
                background_color="#ffffff",
                output_format="PNG",
                color_preset_id=natural.id if natural else None,
            ),
            PhotoTemplate(
                name="Foto redonda transparente",
                description="PNG circular com fundo transparente.",
                width=500,
                height=500,
                shape="circular",
                transparent_background=True,
                background_color="transparent",
                output_format="PNG",
                color_preset_id=natural.id if natural else None,
            ),
        ]
        db.add_all(templates)
        db.commit()
