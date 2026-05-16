from __future__ import annotations

from dataclasses import dataclass
from itertools import combinations
from typing import Mapping

from models.schemas import AspectData, PlanetData


@dataclass(frozen=True)
class AspectSpec:
    name: str
    symbol: str
    angle: float
    max_orb: float
    tension_score: int
    energy: str


ASPECT_SPECS: tuple[AspectSpec, ...] = (
    AspectSpec("Conjunction", "☌", 0.0, 8.0, 0, "focus"),
    AspectSpec("Sextile", "✶", 60.0, 4.0, -2, "support"),
    AspectSpec("Square", "□", 90.0, 6.0, 3, "tension"),
    AspectSpec("Trine", "△", 120.0, 6.0, -3, "flow"),
    AspectSpec("Opposition", "☍", 180.0, 8.0, 2, "polarity"),
)


def _normalize_longitude(value: float) -> float:
    return value % 360


def _angular_distance(longitude_a: float, longitude_b: float) -> float:
    delta = abs(_normalize_longitude(longitude_a) - _normalize_longitude(longitude_b))
    return min(delta, 360 - delta)


def _is_applying(planet_a: PlanetData, planet_b: PlanetData, exact_angle: float, target_angle: float) -> bool:
    current_delta = abs(exact_angle - target_angle)
    next_longitude_a = planet_a.longitude + (planet_a.speed / 24.0)
    next_longitude_b = planet_b.longitude + (planet_b.speed / 24.0)
    future_angle = _angular_distance(next_longitude_a, next_longitude_b)
    future_delta = abs(future_angle - target_angle)
    return future_delta < current_delta


def build_aspects(planets: Mapping[str, PlanetData]) -> list[AspectData]:
    aspects: list[AspectData] = []

    for (planet_1_name, planet_1), (planet_2_name, planet_2) in combinations(planets.items(), 2):
        exact_angle = _angular_distance(planet_1.longitude, planet_2.longitude)

        for spec in ASPECT_SPECS:
            orb = abs(exact_angle - spec.angle)
            if orb > spec.max_orb:
                continue

            aspects.append(
                AspectData(
                    planet_1=planet_1_name,
                    planet_2=planet_2_name,
                    name=spec.name,
                    symbol=spec.symbol,
                    angle=spec.angle,
                    exact_angle=round(exact_angle, 2),
                    orb=round(orb, 2),
                    applying=_is_applying(planet_1, planet_2, exact_angle, spec.angle),
                    tension_score=spec.tension_score,
                    energy=spec.energy,
                    math_str=(
                        f"|{planet_1.longitude:.2f}° - {planet_2.longitude:.2f}°| = "
                        f"{exact_angle:.2f}° ({spec.name} ± {orb:.2f}°)"
                    ),
                )
            )
            break

    return aspects

