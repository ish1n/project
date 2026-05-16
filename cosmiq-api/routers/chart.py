from __future__ import annotations

from fastapi import APIRouter, HTTPException, status

from models.schemas import ChartRequest, ChartResponse
from services.chart import ChartBuildError, build_chart

router = APIRouter(tags=["chart"])


@router.post("/chart", response_model=ChartResponse, status_code=status.HTTP_200_OK)
async def create_chart(payload: ChartRequest) -> ChartResponse:
    try:
        return build_chart(payload)
    except ChartBuildError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc

