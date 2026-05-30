from __future__ import annotations

from datetime import date, datetime, time
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


class TransitRequest(BaseModel):
    natal: ChartRequest
    transit_moment: Optional[datetime] = None

    @field_validator("transit_moment")
    @classmethod
    def validate_transit_moment_has_offset(cls, value: Optional[datetime]) -> Optional[datetime]:
        if value is None:
            return value
        if value.tzinfo is None or value.utcoffset() is None:
            raise ValueError("transit_moment must include an explicit timezone offset.")
        return value


class TransitAspectData(BaseModel):
    natal_planet: str
    transit_planet: str
    name: str
    symbol: str
    angle: float
    exact_angle: float
    orb: float
    applying: bool
    tension_score: int
    energy: str
    math_str: str


class TransitResponse(BaseModel):
    transit_moment_utc: datetime
    transit_planets: dict[str, PlanetData]
    transit_aspects: list[TransitAspectData]
    pressure_score: int
    recommendation: str
    math_summary: str


class ForecastRequest(BaseModel):
    natal: ChartRequest
    start_date: date
    days: int = Field(default=14, ge=1, le=30)


class ForecastDay(BaseModel):
    date: date
    pressure_score: int
    dominant_energy: str
    aspect_count: int
    top_window: str
    math_summary: str


class ForecastResponse(BaseModel):
    generated_at_utc: datetime
    days: list[ForecastDay]
    summary: str


class MoonRequest(BaseModel):
    moment: Optional[datetime] = None

    @field_validator("moment")
    @classmethod
    def validate_moment_has_offset(cls, value: Optional[datetime]) -> Optional[datetime]:
        if value is None:
            return value
        if value.tzinfo is None or value.utcoffset() is None:
            raise ValueError("moment must include an explicit timezone offset.")
        return value


class MoonResponse(BaseModel):
    moment_utc: datetime
    phase_name: str
    phase_angle: float
    illumination: float
    moon_sign: str
    moon_degree: float
    moon_speed: float
    moon_nakshatra: str
    nakshatra_index: int
    advisory: str
    calculation: str
