"""
Unit Tests for Blood Compatibility, Distance Calculation, and Matching Engine.
"""

from datetime import date, timedelta
from models import BloodType, UrgencyLevel, DonorProfile, BloodRequest, Location
from matching_engine import (
    is_blood_compatible,
    haversine_distance,
    is_donor_eligible,
    calculate_match_score,
    find_matching_donors,
    COMPATIBILITY_MATRIX
)


def test_blood_compatibility_matrix():
    # Universal Donor O-
    assert is_blood_compatible(BloodType.A_POS, BloodType.O_NEG) is True
    assert is_blood_compatible(BloodType.B_POS, BloodType.O_NEG) is True
    assert is_blood_compatible(BloodType.AB_POS, BloodType.O_NEG) is True
    assert is_blood_compatible(BloodType.O_NEG, BloodType.O_NEG) is True

    # Universal Recipient AB+
    for b_type in BloodType:
        assert is_blood_compatible(BloodType.AB_POS, b_type) is True

    # O- recipient can ONLY receive O-
    assert is_blood_compatible(BloodType.O_NEG, BloodType.O_POS) is False
    assert is_blood_compatible(BloodType.O_NEG, BloodType.A_NEG) is False

    # A+ recipient can receive A+, A-, O+, O- but NOT B+ or AB+
    assert is_blood_compatible(BloodType.A_POS, BloodType.A_POS) is True
    assert is_blood_compatible(BloodType.A_POS, BloodType.B_POS) is False
    assert is_blood_compatible(BloodType.A_POS, BloodType.AB_POS) is False


def test_haversine_distance():
    # Distance between Empire State Building and Times Square (~1.1 km)
    loc_times_sq = Location(latitude=40.7580, longitude=-73.9855, address="Times Square", city="NYC")
    loc_empire_state = Location(latitude=40.7484, longitude=-73.9857, address="Empire State", city="NYC")

    dist = haversine_distance(loc_times_sq, loc_empire_state)
    assert 0.8 <= dist <= 1.5


def test_donor_eligibility():
    today = date.today()
    eligible_date = today - timedelta(days=60)
    ineligible_date = today - timedelta(days=30)

    donor_eligible = DonorProfile(
        user_id=1,
        user_name="Eligible Donor",
        blood_type=BloodType.O_POS,
        last_donation_date=eligible_date,
        ready_to_donate=True,
        location=Location(latitude=40.7, longitude=-74.0, address="", city=""),
        phone_masked="", email_masked="", next_eligible_date=today
    )
    assert is_donor_eligible(donor_eligible, today) is True

    donor_ineligible = DonorProfile(
        user_id=2,
        user_name="Ineligible Donor",
        blood_type=BloodType.O_POS,
        last_donation_date=ineligible_date,
        ready_to_donate=True,
        location=Location(latitude=40.7, longitude=-74.0, address="", city=""),
        phone_masked="", email_masked="", next_eligible_date=today
    )
    assert is_donor_eligible(donor_ineligible, today) is False


def test_find_matching_donors():
    loc_req = Location(latitude=40.7128, longitude=-74.0060, address="City Hall", city="NYC")
    loc_near = Location(latitude=40.7200, longitude=-74.0000, address="SoHo", city="NYC")
    loc_far = Location(latitude=41.5000, longitude=-75.0000, address="Upstate", city="Upstate")

    req = BloodRequest(
        id=1, requester_id=10, requester_name="Hospital", requester_role="hospital",
        patient_name="Patient 1", blood_type_needed=BloodType.A_POS, units_required=2,
        urgency=UrgencyLevel.CRITICAL, location=loc_req, created_at=date.today(), expires_at=date.today()
    )

    donor_near = DonorProfile(
        user_id=1, user_name="Near A+", blood_type=BloodType.A_POS,
        last_donation_date=date.today() - timedelta(days=90), ready_to_donate=True,
        location=loc_near, phone_masked="", email_masked="", next_eligible_date=date.today()
    )

    donor_far = DonorProfile(
        user_id=2, user_name="Far A+", blood_type=BloodType.A_POS,
        last_donation_date=date.today() - timedelta(days=90), ready_to_donate=True,
        location=loc_far, phone_masked="", email_masked="", next_eligible_date=date.today()
    )

    matches = find_matching_donors(req, [donor_near, donor_far], max_radius_km=30.0)
    assert len(matches) == 1
    assert matches[0][0].user_id == 1  # Only near donor included
