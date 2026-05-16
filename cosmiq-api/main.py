from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.config import get_settings
from core.security import ProxyTokenMiddleware
from routers.chart import router as chart_router
from routers.health import router as health_router


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        docs_url="/docs",
        redoc_url="/redoc",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.add_middleware(
        ProxyTokenMiddleware,
        expected_token=settings.cf_worker_token,
        exempt_paths={"/health", "/docs", "/openapi.json", "/redoc"},
    )

    app.include_router(health_router)
    app.include_router(chart_router)
    return app


app = create_app()

