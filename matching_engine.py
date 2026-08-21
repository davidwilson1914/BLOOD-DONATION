"""
Geospatial & Blood Compatibility Matching Engine.
Provides sublinear lookup, Haversine spatial filtering, and weighted score ranking.
"""

import math
from datetime import date, datetime, timedelta
from typing import List, Tuple, Dict, Any
from models import BloodType, UrgencyLevel, DonorProfile, BloodRequest, Location
from config import WEIGHT_DISTANCE, WEIGHT_URGENCY, WEIGHT_RECENCY, URGENCY_WEIGHTS, MIN_DONATION_INTERVAL_DAYS


# Map: Requested Blood Type -> Compatible Donor Blood Types
COMPATIBILITY_MATRIX: Dict[BloodType, List[BloodType]] = {
    BloodType.A_POS: [BloodType.A_POS, BloodType.A_NEG, BloodType.O_POS, BloodType.O_NEG],
    BloodType.A_NEG: [BloodType.A_NEG, BloodType.O_NEG],
    BloodType.B_POS: [BloodType.B_POS, BloodType.B_NEG, BloodType.O_POS, BloodType.O_NEG],
    BloodType.B_NEG: [BloodType.B_NEG, BloodType.O_NEG],
    BloodType.AB_POS: [
        BloodType.A_POS, BloodType.A_NEG, BloodType.B_POS, BloodType.B_NEG,
        BloodType.AB_POS, BloodType.AB_NEG, BloodType.O_POS, BloodType.O_NEG
    ],  # Universal Recipient
    BloodType.AB_NEG: [BloodType.AB_NEG, BloodType.A_NEG, BloodType.B_NEG, BloodType.O_NEG],
    BloodType.O_POS: [BloodType.O_POS, BloodType.O_NEG],
    BloodType.O_NEG: [BloodType.O_NEG]  # Universal Donor for all, but O- receiver can only take O-
}


def haversine_distance(loc1: Location, loc2: Location) -> float:
    """
    Calculate the great circle distance in kilometers between two points
    on the Earth using the Haversine formula.
    """
    R = 6371.0  # Radius of Earth in kilometers

    lat1_rad = math.radians(loc1.latitude)
    lon1_rad = math.radians(loc1.longitude)
    lat2_rad = math.radians(loc2.latitude)
    lon2_rad = math.radians(loc2.longitude)

    dlat = lat2_rad - lat1_rad
    dlon = lon2_rad - lon1_rad

    a = math.sin(dlat / 2.0) ** 2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon / 2.0) ** 2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))

    return round(R * c, 2)


def is_blood_compatible(requested_type: BloodType, donor_type: BloodType) -> bool:
    """Checks if a donor's blood type can be safely transfused to a recipient."""
    compatible_donors = COMPATIBILITY_MATRIX.get(requested_type, [])
    return donor_type in compatible_donors


def is_donor_eligible(donor: DonorProfile, check_date: date = None) -> bool:
    """
    Checks donor eligibility based on:
    1. Active toggle status (ready_to_donate)
    2. Minimum interval (56 days) since last donation
    """
    if not donor.ready_to_donate:
        return False

    if donor.last_donation_date is None:
        return True

    if check_date is None:
        check_date = date.today()

    days_passed = (check_date - donor.last_donation_date).days
    return days_passed >= MIN_DONATION_INTERVAL_DAYS


def calculate_match_score(
    distance_km: float,
    urgency: UrgencyLevel,
    last_donation_date: date = None,
    check_date: date = None
) -> float:
    """
    Computes a weighted match score.
    Lower score indicates a better, higher-priority match.
    """
    if check_date is None:
        check_date = date.today()

    # Distance component (50% weight)
    distance_score = distance_km

    # Urgency penalty (35% weight)
    urgency_penalty = URGENCY_WEIGHTS.get(urgency, 20.0)

    # Days since donation bonus (15% weight)
    if last_donation_date:
        days_since = (check_date - last_donation_date).days
        recency_bonus = min(100.0, days_since - MIN_DONATION_INTERVAL_DAYS)
    else:
        recency_bonus = 50.0  # First-time or unrecorded donor

    final_score = (WEIGHT_DISTANCE * distance_score) + (WEIGHT_URGENCY * urgency_penalty) - (WEIGHT_RECENCY * recency_bonus)
    return round(max(0.1, final_score), 2)


def find_matching_donors(
    request: BloodRequest,
    donors: List[DonorProfile],
    max_radius_km: float = 50.0
) -> List[Tuple[DonorProfile, float, float]]:
    """
    Spatial & Compatibility Filter + Rank Pipeline:
    1. Filter compatible blood types
    2. Filter active & eligible donors
    3. Calculate spatial distance (Haversine) and filter within radius
    4. Rank candidates by weighted match score
    
    Returns list of tuples: (donor, distance_km, match_score)
    """
    compatible_types = COMPATIBILITY_MATRIX.get(request.blood_type_needed, [])
    today = date.today()
    candidates = []

    for donor in donors:
        # Step 1: Compatibility Filter
        if donor.blood_type not in compatible_types:
            continue

        # Step 2: Eligibility Check
        if not is_donor_eligible(donor, today):
            continue

        # Step 3: Spatial Radius Filter
        dist = haversine_distance(donor.location, request.location)
        effective_radius = min(max_radius_km, donor.max_travel_radius_km)
        if dist > effective_radius:
            continue

        # Step 4: Scoring
        score = calculate_match_score(dist, request.urgency, donor.last_donation_date, today)
        candidates.append((donor, dist, score))

    # Sort by match score ascending (best matches first)
    candidates.sort(key=lambda item: item[2])
    return candidates
