from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api import color_presets, jobs, photo_templates, process
from app.core.config import get_settings
from app.core.database import Base, SessionLocal, engine
from app.services.templates.seed import seed_defaults


settings = get_settings()


def create_app() -> FastAPI:
    app = FastAPI(title=settings.app_name, version="0.1.0")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=[
            "X-Filename",
            "Content-Disposition",
            "X-Face-Detected",
            "X-Face-Count",
            "X-Face-Detector",
            "X-Face-Confidence",
            "X-Face-X",
            "X-Face-Y",
            "X-Face-Width",
            "X-Face-Height",
            "X-Quality-Score",
            "X-Quality-Status",
            "X-Quality-Width",
            "X-Quality-Height",
            "X-Quality-Brightness",
            "X-Quality-Blur",
            "X-Quality-Needs-Review",
        ],
    )

    app.mount("/files/input", StaticFiles(directory=settings.input_dir), name="input")
    app.mount("/files/output", StaticFiles(directory=settings.output_dir), name="output")
    app.mount("/files/debug", StaticFiles(directory=settings.debug_dir), name="debug")

    app.include_router(photo_templates.router, prefix=settings.api_prefix)
    app.include_router(color_presets.router, prefix=settings.api_prefix)
    app.include_router(process.router, prefix=settings.api_prefix)
    app.include_router(jobs.router, prefix=settings.api_prefix)

    @app.get("/health")
    def health() -> dict[str, str]:
        return {"status": "ok", "app": settings.app_name}

    return app


Base.metadata.create_all(bind=engine)
with SessionLocal() as db:
    seed_defaults(db)

app = create_app()
