import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_read_root():
    response = client.get("/")
    assert response.status_code == 200
    assert "message" in response.json()

def test_summarize_invalid_url():
    response = client.post("/summarize", json={"url": "invalid-url"})
    assert response.status_code == 400
    assert "detail" in response.json()

def test_summarize_missing_url():
    response = client.post("/summarize", json={})
    assert response.status_code == 422
    assert "detail" in response.json()
