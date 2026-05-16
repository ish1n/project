from __future__ import annotations

import threading
from collections import OrderedDict
from datetime import datetime, timezone

from core.config import get_settings
from models.schemas import PlanetData

try:
    import swisseph as swe
except ImportError:  # pragma: no cover - exercised in environments without the package
    swe = None


PLANETS = OrderedDict(
    (
        ("Sun", "SUN"),
        ("Moon", "MOON"),
        ("Mercury", "MERCURY"),
        ("Venus", "VENUS"),
        ("Mars", "MARS"),
        ("Jupiter", "JUPITER"),
        ("Saturn", "SATURN"),
    )
)
SIGNS = (
    "Aries",
    "Taurus",
    "Gemini",
    "Cancer",
    "Leo",
    "Virgo",
    "Libra",
    "Scorpio",
    "Sagittarius",
    "Capricorn",
    "Aquarius",
    "Pisces",
)

_SWISSEPH_LOCK = threading.RLock()
_THREAD_STATE = threading.local()


def _require_swisseph() -> None:
    if swe is None:
        raise RuntimeError(
            "pyswisseph is not installed. Install the backend dependencies before calling /chart."
        )


def _configure_swisseph() -> None:
    settings = get_settings()
    configured_path = getattr(_THREAD_STATE, "ephe_path", None)

    if settings.swisseph_path and configured_path != settings.swisseph_path:
        swe.set_ephe_path(settings.swisseph_path)
        _THREAD_STATE.ephe_path = settings.swisseph_path


def _to_decimal_hour(moment_utc: datetime) -> float:
    return (
        moment_utc.hour
        + (moment_utc.minute / 60)
        + (moment_utc.second / 3600)
        + (moment_utc.microsecond / 3_600_000_000)
    )


def _normalize_longitude(value: float) -> float:
    return value % 360


def _get_sign(longitude: float) -> tuple[str, float]:
    sign_index = int(_normalize_longitude(longitude) / 30)
    degree = _normalize_longitude(longitude) % 30
    return SIGNS[sign_index], round(degree, 2)


def _calculate_sidereal_longitude(julian_day: float, planet_id: int, flags: int) -> float:
    swe.set_sid_mode(swe.SIDM_LAHIRI, 0, 0)
    result, _ = swe.calc_ut(julian_day, planet_id, flags | swe.FLG_SIDEREAL)
    return _normalize_longitude(result[0])


def build_planet_payload(moment_utc: datetime) -> tuple[float, float, dict[str, PlanetData]]:
    _require_swisseph()

    if moment_utc.tzinfo is None:
        raise RuntimeError("Chart calculation requires a timezone-aware datetime.")

    utc_moment = moment_utc.astimezone(timezone.utc)
    flags = swe.FLG_SWIEPH | swe.FLG_SPEED

    with _SWISSEPH_LOCK:
        _configure_swisseph()
        julian_day = swe.julday(
            utc_moment.year,
            utc_moment.month,
            utc_moment.day,
            _to_decimal_hour(utc_moment),
        )

        planets: dict[str, PlanetData] = OrderedDict()
        for planet_name, swiss_constant in PLANETS.items():
            result, _ = swe.calc_ut(julian_day, getattr(swe, swiss_constant), flags)
            longitude = _normalize_longitude(result[0])
            sign, degree = _get_sign(longitude)
            sidereal_longitude = _calculate_sidereal_longitude(
                julian_day, getattr(swe, swiss_constant), flags
            )

            planets[planet_name] = PlanetData(
                longitude=round(longitude, 2),
                latitude=round(result[1], 4),
                speed=round(result[3], 4),
                sign=sign,
                degree=degree,
                retrograde=result[3] < 0,
                sidereal_longitude=round(sidereal_longitude, 2),
            )

    t_centuries = (julian_day - 2451545.0) / 36525
    return julian_day, t_centuries, planets

