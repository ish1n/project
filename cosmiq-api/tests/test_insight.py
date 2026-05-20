from fastapi.testclient import TestClient

from main import app


client = TestClient(app)


def test_insight_endpoint_returns_math_and_source_passage() -> None:
    response = client.post(
        "/insight",
        json={
            "aspects": [
                {
                    "planet_1": "Mars",
                    "planet_2": "Saturn",
                    "name": "Square",
                    "symbol": "□",
                    "angle": 90,
                    "exact_angle": 89.73,
                    "orb": 0.27,
                    "applying": True,
                    "tension_score": 3,
                    "energy": "tension",
                    "math_str": "|134.22° - 44.49°| = 89.73° (Square ± 0.27°)",
                }
            ],
            "domains": ["Drive"],
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["insights"][0]["domain"] == "Drive"
    assert body["insights"][0]["math_str"]
    assert body["insights"][0]["source_passage"]["id"]
