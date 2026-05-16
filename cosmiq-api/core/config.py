from __future__ import annotations

import os
from functools import lru_cache
from typing import Optional

from pydantic import BaseModel, Field


def _split_csv(value: Optional[str]) -> list[str]:
    if not value:
        return []
    return [item.strip() for item in value.split(",") if item.strip()]


class Settings(BaseModel):
    app_name: str = "COSMIQ API"
    app_version: str = "0.1.0"
    app_env: str = Field(default_factory=lambda: os.getenv("APP_ENV", "development"))
    cors_origins: list[str] = Field(
        default_factory=lambda: _split_csv(os.getenv("CORS_ORIGINS", "http://localhost:3000"))
    )
    swisseph_path: Optional[str] = Field(default_factory=lambda: os.getenv("SWISSEPH_PATH"))
    cf_worker_token: Optional[str] = Field(default_factory=lambda: os.getenv("CF_WORKER_TOKEN"))


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
