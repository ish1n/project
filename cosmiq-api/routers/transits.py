from __future__ import annotations

from fastapi import APIRouter, HTTPException, status

from models.schemas import (
    ForecastRequest,
    ForecastResponse,
    MoonRequest,
    MoonResponse,
    TransitRequest,
    TransitResponse,
)
from services.transits import TransitBuildError, build_forecast, build_moon, build_transit

router = APIRouter(tags=["transits"])


@router.post("/transits", response_model=TransitResponse, status_code=status.HTTP_200_OK)
async def create_transits(payload: TransitRequest) -> TransitResponse:
    try:
        return build_transit(payload)
    except TransitBuildError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc


@router.post("/forecast", response_model=ForecastResponse, status_code=status.HTTP_200_OK)
async def create_forecast(payload: ForecastRequest) -> ForecastResponse:
    try:
        return build_forecast(payload)
    except TransitBuildError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc


@router.post("/moon", response_model=MoonResponse, status_code=status.HTTP_200_OK)
async def create_moon(payload: MoonRequest) -> MoonResponse:
    try:
        return build_moon(payload)
    except TransitBuildError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc
