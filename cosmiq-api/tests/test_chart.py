from datetime import date, time, timezone

from fastapi.testclient import TestClient

from main import app
from models.schemas import ChartResponse, NakshatraData, PlanetData


client = TestClient(app)


def test_chart_endpoint_returns_contract_shape(monkeypatch) -> None:
    from routers import chart as chart_router

    def fake_build_chart(_payload):
        return ChartResponse(
            julian_day=2447961.3021,
            t_centuries=-0.09642813,
            planets={
                "Sun": PlanetData(
                    longitude=84.31,
                    latitude=0.0001,
                    speed=0.9531,
                    sign="Gemini",
                    degree=24.31,
                    retrograde=False,
                    sidereal_longitude=60.51,
                ),
                "Moon": PlanetData(
                    longitude=102.55,
                    latitude=1.4432,
                    speed=13.2112,
                    sign="Cancer",
                    degree=12.55,
                    retrograde=False,
                    sidereal_longitude=78.75,
                ),
            },
            aspects=[],
            nakshatra=NakshatraData(
                moon_nakshatra="Punarvasu",
                nakshatra_index=6,
                calculation="floor((78.75 / 360) * 27) = 6",
            ),
        )

    monkeypatch.setattr(chart_router, "build_chart", fake_build_chart)

    response = client.post(
        "/chart",
        json={
            "birth_date": str(date(1990, 6, 15)),
            "birth_time": time(8, 30, tzinfo=timezone.utc).isoformat(),
            "birth_lat": 26.8467,
            "birth_lng": 80.9462,
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["planets"]["Sun"]["sign"] == "Gemini"
    assert body["nakshatra"]["moon_nakshatra"] == "Punarvasu"
