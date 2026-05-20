from __future__ import annotations

from datetime import date, time
from typing import Optional

from pydantic import BaseModel, Field, field_validator


class ChartRequest(BaseModel):
    birth_date: date
    birth_time: time
    birth_lat: float = Field(ge=-90, le=90)
    birth_lng: float = Field(ge=-180, le=180)

    @field_validator("birth_time")
    @classmethod
    def validate_birth_time_has_offset(cls, value: time) -> time:
        if value.tzinfo is None or value.utcoffset() is None:
            raise ValueError("birth_time must include an explicit timezone offset.")
        return value


class PlanetData(BaseModel):
    longitude: float
    latitude: float
    speed: float
    sign: str
    degree: float
    retrograde: bool
    sidereal_longitude: float


class AspectData(BaseModel):
    planet_1: str
    planet_2: str
    name: str
    symbol: str
    angle: float
    exact_angle: float
    orb: float
    applying: bool
    tension_score: int
    energy: str
    math_str: str


class NakshatraData(BaseModel):
    moon_nakshatra: str
    nakshatra_index: int
    calculation: str


class ChartResponse(BaseModel):
    julian_day: float
    t_centuries: float
    planets: dict[str, PlanetData]
    aspects: list[AspectData]
    nakshatra: NakshatraData


class SourcePassage(BaseModel):
    id: str
    source: str
    excerpt: str


class InsightRequest(BaseModel):
    aspects: list[AspectData]
    domains: Optional[list[str]] = None


class InsightData(BaseModel):
    domain: str
    score: int
    advice: str
    aspect: AspectData
    math_str: str
    source_passage: SourcePassage


class InsightResponse(BaseModel):
    insights: list[InsightData]
