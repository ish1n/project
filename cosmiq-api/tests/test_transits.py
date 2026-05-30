from datetime import date, datetime, timezone

from fastapi.testclient import TestClient

from main import app
from models.schemas import (
    ForecastDay,
    ForecastResponse,
    MoonResponse,
    PlanetData,
    TransitAspectData,
    TransitResponse,
)


client = TestClient(app)


def test_transits_endpoint_returns_pressure_and_aspects(monkeypatch) -> None:
    from routers import transits as transits_router

    def fake_build_transit(_payload):
        return TransitResponse(
            transit_moment_utc=datetime(2026, 5, 30, 12, tzinfo=timezone.utc),
            transit_planets={
                "Moon": PlanetData(
                    longitude=102.1,
                    latitude=1.1,
                    speed=13.2,
                    sign="Cancer",
                    degree=12.1,
                    retrograde=False,
                    sidereal_longitude=78.3,
                )
            },
            transit_aspects=[
                TransitAspectData(
                    natal_planet="Mercury",
                    transit_planet="Moon",
                    name="Square",
                    symbol="square",
                    angle=90,
                    exact_angle=89.8,
                    orb=0.2,
                    applying=True,
                    tension_score=3,
                    energy="tension",
                    math_str="test",
                )
            ],
            pressure_score=8,
            recommendation="Slow the review window.",
            math_summary="1 aspect scored.",
        )

    monkeypatch.setattr(transits_router, "build_transit", fake_build_transit)

    response = client.post(
        "/transits",
        json={
            "natal": {
                "birth_date": "1990-06-15",
                "birth_time": "08:30:00+05:30",
                "birth_lat": 26.8467,
                "birth_lng": 80.9462,
            },
            "transit_moment": "2026-05-30T12:00:00+00:00",
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["pressure_score"] == 8
    assert body["transit_aspects"][0]["natal_planet"] == "Mercury"


def test_forecast_endpoint_returns_daily_windows(monkeypatch) -> None:
    from routers import transits as transits_router

    def fake_build_forecast(_payload):
        return ForecastResponse(
            generated_at_utc=datetime(2026, 5, 30, 12, tzinfo=timezone.utc),
            days=[
                ForecastDay(
                    date=date(2026, 5, 30),
                    pressure_score=4,
                    dominant_energy="mixed",
                    aspect_count=2,
                    top_window="Moon Trine natal Venus",
                    math_summary="2 aspects scored.",
                )
            ],
            summary="Highest signal lands on 2026-05-30 with score 4.",
        )

    monkeypatch.setattr(transits_router, "build_forecast", fake_build_forecast)

    response = client.post(
        "/forecast",
        json={
            "natal": {
                "birth_date": "1990-06-15",
                "birth_time": "08:30:00+05:30",
                "birth_lat": 26.8467,
                "birth_lng": 80.9462,
            },
            "start_date": "2026-05-30",
            "days": 7,
        },
    )

    assert response.status_code == 200
    assert response.json()["days"][0]["top_window"] == "Moon Trine natal Venus"


def test_moon_endpoint_returns_phase_contract(monkeypatch) -> None:
    from routers import transits as transits_router

    def fake_build_moon(_payload):
        return MoonResponse(
            moment_utc=datetime(2026, 5, 30, 12, tzinfo=timezone.utc),
            phase_name="Full Moon",
            phase_angle=180,
            illumination=1,
            moon_sign="Sagittarius",
            moon_degree=12.4,
            moon_speed=12.1,
            moon_nakshatra="Mula",
            nakshatra_index=18,
            advisory="Use this window for review.",
            calculation="phase math",
        )

    monkeypatch.setattr(transits_router, "build_moon", fake_build_moon)

    response = client.post("/moon", json={"moment": "2026-05-30T12:00:00+00:00"})

    assert response.status_code == 200
    body = response.json()
    assert body["phase_name"] == "Full Moon"
    assert body["moon_nakshatra"] == "Mula"
