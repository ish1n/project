from __future__ import annotations

from collections.abc import Iterable
from typing import Optional

from fastapi import status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request


class ProxyTokenMiddleware(BaseHTTPMiddleware):
    """Require the shared edge token outside local development when configured."""

    def __init__(
        self,
        app,
        *,
        expected_token: Optional[str],
        exempt_paths: Optional[Iterable[str]] = None,
    ) -> None:
        super().__init__(app)
        self.expected_token = expected_token
        self.exempt_paths = set(exempt_paths or ())

    async def dispatch(self, request: Request, call_next):
        if request.url.path in self.exempt_paths or not self.expected_token:
            return await call_next(request)

        token = request.headers.get("CF-Worker-Token")
        if token != self.expected_token:
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={"detail": "Missing or invalid CF-Worker-Token header."},
            )

        return await call_next(request)
