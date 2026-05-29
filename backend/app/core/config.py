from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "FlowImage"
    api_prefix: str = "/api"
    database_url: str = "sqlite:///./flowimage.db"
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    root_dir: Path = Path(__file__).resolve().parents[3]
    input_dir: Path = root_dir / "input"
    output_dir: Path = root_dir / "output"
    debug_dir: Path = root_dir / "debug"

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    settings = Settings()
    settings.input_dir.mkdir(parents=True, exist_ok=True)
    settings.output_dir.mkdir(parents=True, exist_ok=True)
    settings.debug_dir.mkdir(parents=True, exist_ok=True)
    return settings
