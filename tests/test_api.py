"""
Integration Tests for FastAPI Blood Donor Matching Endpoints.
"""

from fastapi.testclient import TestClient
from main import app
from models import MatchResponseStatus

client = TestClient(app)


def test_get_donors_endpoint():
    response = client.get("/api/donors")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 5
    # Verify contact masking
    first_donor = data[0]
    assert "*****" in first_donor["phone_masked"] or "***" in first_donor["phone_masked"]
    assert first_donor["phone_unmasked"] is None  # Masked by default


def test_create_request_and_matching_flow():
    payload = {
        "patient_name": "Test Surgery Patient",
        "blood_type_needed": "O-",
        "units_required": 3,
        "urgency": "CRITICAL",
        "location": {
            "latitude": 40.7580,
            "longitude": -73.9855,
            "address": "Times Square Medical Center",
            "city": "New York"
        },
        "hospital_name": "Times Square Clinic",
        "notes": "Urgent trauma match test."
    }

    response = client.post("/api/requests?requester_id=2&requester_role=hospital", json=payload)
    assert response.status_code == 200
    req_data = response.json()
    assert req_data["patient_name"] == "Test Surgery Patient"
    assert req_data["matched_donor_count"] >= 1  # Should match O- universal donor

    req_id = req_data["id"]

    # Check match list
    matches_resp = client.get(f"/api/requests/{req_id}/matches")
    assert matches_resp.status_code == 200
    matches = matches_resp.json()
    assert len(matches) >= 1

    # Simulate Donor Accept
    match_id = matches[0]["id"]
    donor_id = matches[0]["donor_id"]

    respond_resp = client.post(
        f"/api/matches/{match_id}/respond?action=ACCEPTED&donor_id={donor_id}"
    )
    assert respond_resp.status_code == 200
    responded_data = respond_resp.json()
    assert responded_data["status"] == "ACCEPTED"
    assert responded_data["unlocked_contact_phone"] is not None  # Unmasked upon accept!


def test_hospital_inventory_low_stock_alert():
    # Set O- stock to 1 unit (min threshold is 4)
    resp = client.post(
        "/api/hospitals/2/inventory?blood_type=O-&units_available=1"
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["auto_alert_created"] is True
    assert data["auto_request"]["blood_type_needed"] == "O-"


def test_register_new_donor():
    reg_payload = {
        "name": "Sarah Connor",
        "email": "sarah.connor@sky.net",
        "phone": "+1 555-0199",
        "blood_type": "O-",
        "location": {
            "latitude": 40.7128,
            "longitude": -74.0060,
            "address": "Lower Manhattan",
            "city": "New York"
        },
        "is_first_time_donor": True,
        "max_travel_radius_km": 40.0,
        "age": 28,
        "weight_kg": 62.0,
        "preferred_notification_channel": "WhatsApp / SMS",
        "medical_notes": "Healthy runner"
    }

    resp = client.post("/api/donors/register", json=reg_payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["user_name"] == "Sarah Connor"
    assert data["blood_type"] == "O-"
    assert data["is_eligible"] is True

