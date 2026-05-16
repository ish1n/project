from __future__ import annotations

from datetime import datetime, timezone

from models.schemas import ChartRequest, ChartResponse, NakshatraData
from services.aspects import build_aspects
from services.ephemeris import build_planet_payload

NAKSHATRAS: tuple[str, ...] = (
    "Ashwini",
    "Bharani",
    "Krittika",
    "Rohini",
    "Mrigashira",
    "Ardra",
    "Punarvasu",
    "Pushya",
    "Ashlesha",
    "Magha",
    "Purva Phalguni",
    "Uttara Phalguni",
    "Hasta",
    "Chitra",
    "Swati",
    "Vishakha",
    "Anuradha",
    "Jyeshtha",
    "Mula",
    "Purva Ashadha",
    "Uttara Ashadha",
    "Shravana",
    "Dhanishta",
    "Shatabhisha",
    "Purva Bhadrapada",
    "Uttara Bhadrapada",
    "Revati",
)


class ChartBuildError(RuntimeError):
    """Raised when chart construction cannot be completed."""


def _combine_birth_moment(payload: ChartRequest) -> datetime:
    combined = datetime.combine(payload.birth_date, payload.birth_time)
    return combined.astimezone(timezone.utc)


def _build_nakshatra(moon_sidereal_longitude: float) -> NakshatraData:
    index = int((moon_sidereal_longitude % 360) / (360 / 27))
    return NakshatraData(
        moon_nakshatra=NAKSHATRAS[index],
        nakshatra_index=index,
        calculation=f"floor(({moon_sidereal_longitude:.2f} / 360) * 27) = {index}",
    )


def build_chart(payload: ChartRequest) -> ChartResponse:
    try:
        birth_moment_utc = _combine_birth_moment(payload)
        julian_day, t_centuries, planets = build_planet_payload(birth_moment_utc)
        aspects = build_aspects(planets)
        nakshatra = _build_nakshatra(planets["Moon"].sidereal_longitude)
    except RuntimeError as exc:
        raise ChartBuildError(str(exc)) from exc

    return ChartResponse(
        julian_day=round(julian_day, 4),
        t_centuries=round(t_centuries, 8),
        planets=planets,
        aspects=aspects,
        nakshatra=nakshatra,
    )

