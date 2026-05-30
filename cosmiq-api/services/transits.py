from __future__ import annotations

from datetime import datetime, time, timezone
from math import cos, radians

from models.schemas import (
    ForecastDay,
    ForecastRequest,
    ForecastResponse,
    MoonRequest,
    MoonResponse,
    PlanetData,
    TransitAspectData,
    TransitRequest,
    TransitResponse,
)
from services.aspects import ASPECT_SPECS
from services.chart import _build_nakshatra, build_chart
from services.ephemeris import build_planet_payload


class TransitBuildError(RuntimeError):
    """Raised when transit, forecast, or moon construction cannot be completed."""


def build_transit(payload: TransitRequest) -> TransitResponse:
    try:
        natal_chart = build_chart(payload.natal)
        transit_moment = _resolve_moment(payload.transit_moment)
        _, _, transit_planets = build_planet_payload(transit_moment)
        transit_aspects = _build_transit_aspects(natal_chart.planets, transit_planets)
    except RuntimeError as exc:
        raise TransitBuildError(str(exc)) from exc

    pressure_score = _pressure_score(transit_aspects)
    return TransitResponse(
        transit_moment_utc=transit_moment,
        transit_planets=transit_planets,
        transit_aspects=transit_aspects[:12],
        pressure_score=pressure_score,
        recommendation=_recommendation_for_pressure(pressure_score),
        math_summary=(
            f"{len(transit_aspects)} natal/transit aspects scored; pressure = "
            f"sum(weighted tension by orb) = {pressure_score}"
        ),
    )


def build_forecast(payload: ForecastRequest) -> ForecastResponse:
    days: list[ForecastDay] = []

    for offset in range(payload.days):
        forecast_date = payload.start_date.fromordinal(payload.start_date.toordinal() + offset)
        transit_moment = datetime.combine(forecast_date, time(12, 0, tzinfo=timezone.utc))
        transit_response = build_transit(
            TransitRequest(natal=payload.natal, transit_moment=transit_moment)
        )
        top_aspect = transit_response.transit_aspects[0] if transit_response.transit_aspects else None
        days.append(
            ForecastDay(
                date=forecast_date,
                pressure_score=transit_response.pressure_score,
                dominant_energy=_dominant_energy(transit_response.transit_aspects),
                aspect_count=len(transit_response.transit_aspects),
                top_window=(
                    f"{top_aspect.transit_planet} {top_aspect.name} natal {top_aspect.natal_planet}"
                    if top_aspect
                    else "Low-aspect operating window"
                ),
                math_summary=transit_response.math_summary,
            )
        )

    highest = max(days, key=lambda day: abs(day.pressure_score)) if days else None
    summary = (
        f"Highest signal lands on {highest.date.isoformat()} with score "
        f"{highest.pressure_score}."
        if highest
        else "No forecast days generated."
    )
    return ForecastResponse(generated_at_utc=datetime.now(timezone.utc), days=days, summary=summary)


def build_moon(payload: MoonRequest) -> MoonResponse:
    try:
        moment = _resolve_moment(payload.moment)
        _, _, planets = build_planet_payload(moment)
    except RuntimeError as exc:
        raise TransitBuildError(str(exc)) from exc

    sun = planets["Sun"]
    moon = planets["Moon"]
    phase_angle = (moon.longitude - sun.longitude) % 360
    illumination = (1 - cos(radians(phase_angle))) / 2
    nakshatra = _build_nakshatra(moon.sidereal_longitude)

    return MoonResponse(
        moment_utc=moment,
        phase_name=_phase_name(phase_angle),
        phase_angle=round(phase_angle, 2),
        illumination=round(illumination, 3),
        moon_sign=moon.sign,
        moon_degree=moon.degree,
        moon_speed=moon.speed,
        moon_nakshatra=nakshatra.moon_nakshatra,
        nakshatra_index=nakshatra.nakshatra_index,
        advisory=_moon_advisory(phase_angle, moon.speed),
        calculation=(
            f"Moon phase angle = ({moon.longitude:.2f} - {sun.longitude:.2f}) mod 360 "
            f"= {phase_angle:.2f}; illumination = (1 - cos(angle)) / 2"
        ),
    )


def _resolve_moment(moment: datetime | None) -> datetime:
    if moment is None:
        return datetime.now(timezone.utc)
    return moment.astimezone(timezone.utc)


def _normalize_longitude(value: float) -> float:
    return value % 360


def _angular_distance(longitude_a: float, longitude_b: float) -> float:
    delta = abs(_normalize_longitude(longitude_a) - _normalize_longitude(longitude_b))
    return min(delta, 360 - delta)


def _is_transit_applying(natal: PlanetData, transit: PlanetData, exact_angle: float, target_angle: float) -> bool:
    current_delta = abs(exact_angle - target_angle)
    future_angle = _angular_distance(natal.longitude, transit.longitude + (transit.speed / 24.0))
    future_delta = abs(future_angle - target_angle)
    return future_delta < current_delta


def _build_transit_aspects(
    natal_planets: dict[str, PlanetData], transit_planets: dict[str, PlanetData]
) -> list[TransitAspectData]:
    aspects: list[TransitAspectData] = []

    for natal_name, natal_planet in natal_planets.items():
        for transit_name, transit_planet in transit_planets.items():
            exact_angle = _angular_distance(natal_planet.longitude, transit_planet.longitude)

            for spec in ASPECT_SPECS:
                orb = abs(exact_angle - spec.angle)
                if orb > spec.max_orb:
                    continue

                aspects.append(
                    TransitAspectData(
                        natal_planet=natal_name,
                        transit_planet=transit_name,
                        name=spec.name,
                        symbol=spec.symbol,
                        angle=spec.angle,
                        exact_angle=round(exact_angle, 2),
                        orb=round(orb, 2),
                        applying=_is_transit_applying(
                            natal_planet, transit_planet, exact_angle, spec.angle
                        ),
                        tension_score=spec.tension_score,
                        energy=spec.energy,
                        math_str=(
                            f"|natal {natal_name} {natal_planet.longitude:.2f}deg - "
                            f"transit {transit_name} {transit_planet.longitude:.2f}deg| = "
                            f"{exact_angle:.2f}deg ({spec.name} +/- {orb:.2f}deg)"
                        ),
                    )
                )
                break

    return sorted(aspects, key=lambda aspect: (-abs(aspect.tension_score), aspect.orb))


def _pressure_score(aspects: list[TransitAspectData]) -> int:
    total = 0.0
    for aspect in aspects:
        max_orb = next(spec.max_orb for spec in ASPECT_SPECS if spec.name == aspect.name)
        weight = max(0.25, 1 - (aspect.orb / max_orb))
        total += aspect.tension_score * weight
    return round(max(-24, min(24, total)))


def _recommendation_for_pressure(score: int) -> str:
    if score >= 7:
        return "Schedule sensitive decisions after a review buffer; pressure is high enough to reward slower execution."
    if score <= -5:
        return "Use this lower-friction window for outreach, design review, and collaborative planning."
    return "Keep the day operational: define one concrete decision, one owner, and one follow-up checkpoint."


def _dominant_energy(aspects: list[TransitAspectData]) -> str:
    if not aspects:
        return "quiet"
    score = _pressure_score(aspects)
    if score >= 5:
        return "tension"
    if score <= -4:
        return "support"
    return "mixed"


def _phase_name(angle: float) -> str:
    phase_buckets = (
        (22.5, "New Moon"),
        (67.5, "Waxing Crescent"),
        (112.5, "First Quarter"),
        (157.5, "Waxing Gibbous"),
        (202.5, "Full Moon"),
        (247.5, "Waning Gibbous"),
        (292.5, "Last Quarter"),
        (337.5, "Waning Crescent"),
        (360.0, "New Moon"),
    )
    for boundary, name in phase_buckets:
        if angle < boundary:
            return name
    return "New Moon"


def _moon_advisory(angle: float, moon_speed: float) -> str:
    if angle < 45 or angle >= 315:
        return "Use this window for setup, scope control, and private planning before public commitments."
    if 135 <= angle < 225:
        return "Use this window for review, visibility, and honest status checks; assumptions are easier to surface."
    if moon_speed < 11:
        return "The Moon is moving slowly; keep decisions reversible and let signals accumulate."
    return "The Moon is moving cleanly enough for lightweight execution and short feedback loops."
