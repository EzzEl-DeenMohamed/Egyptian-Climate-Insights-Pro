import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_get_historical_data():
    response = client.get("/data/?region=egypt")
    assert response.status_code == 200
    assert "data" in response.json()

def test_predict():
    response = client.post("/predict/", json={"feature1": 1.2, "feature2": 2.3})
    assert response.status_code == 200
    assert "prediction" in response.json()
