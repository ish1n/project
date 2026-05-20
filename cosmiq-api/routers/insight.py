from __future__ import annotations

from fastapi import APIRouter, status

from models.schemas import InsightRequest, InsightResponse
from services.insight import build_insights

router = APIRouter(tags=["insight"])


@router.post("/insight", response_model=InsightResponse, status_code=status.HTTP_200_OK)
async def create_insight(payload: InsightRequest) -> InsightResponse:
    return InsightResponse(
        insights=build_insights(payload.aspects, payload.domains),
    )
