"""
Database Store and Seed Generator for LifePulse Platform.
Holds active data state for Users, Donors, Hospitals, Requests, Matches, and Audit Logs.
"""

from datetime import datetime, date, timedelta
from typing import List, Optional, Dict
from models import (
    User, UserRole, DonorProfile, Hospital, BloodRequest, MatchResponse,
    BloodType, UrgencyLevel, RequestStatus, MatchResponseStatus, Location, Campaign
)
from privacy_security import privacy_manager


class DatabaseStore:
    def __init__(self):
        self.users: List[User] = []
        self.donors: List[DonorProfile] = []
        self.hospitals: List[Hospital] = []
        self.requests: List[BloodRequest] = []
        self.matches: List[MatchResponse] = []
        self.campaigns: List[Campaign] = []
        self._seed_initial_data()

    def _seed_initial_data(self):
        """Populates realistic seed data for immediate platform testing."""
        today = date.today()

        # 1. Seed Users & Admin
        admin_user = User(
            id=1,
            name="System Administrator",
            email="admin@lifepulse.org",
            phone="+1 555-0100",
            role=UserRole.ADMIN,
            created_at=datetime.now() - timedelta(days=100)
        )
        self.users.append(admin_user)

        # 2. Seed Hospitals
        hospital_data = [
            (2, "Mount Sinai Hospital", "HOSP-NY-88392", 40.7890, -73.9548, "1468 Madison Ave", "New York", "+1 212-241-6500"),
            (3, "Bellevue Hospital Center", "HOSP-NY-11029", 40.7391, -73.9754, "462 1st Ave", "New York", "+1 212-562-4141"),
            (4, "NYU Langone Health", "HOSP-NY-44821", 40.7423, -73.9739, "550 1st Ave", "New York", "+1 212-263-7300"),
        ]

        for u_id, name, lic, lat, lon, addr, city, phone in hospital_data:
            user = User(
                id=u_id,
                name=name,
                email=f"contact@{name.lower().replace(' ', '')}.org",
                phone=phone,
                role=UserRole.HOSPITAL,
                created_at=datetime.now() - timedelta(days=60)
            )
            self.users.append(user)
            hospital = Hospital(
                id=u_id,
                user_id=u_id,
                name=name,
                license_number=lic,
                address=addr,
                location=Location(latitude=lat, longitude=lon, address=addr, city=city),
                contact_phone=phone,
                verified=True
            )
            self.hospitals.append(hospital)

        # 3. Seed Donors
        donor_seeds = [
            # Name, BloodType, lat, lon, city, days_since_last_donation, ready_to_donate, total_donations
            ("Alexander Wright", BloodType.O_NEG, 40.7580, -73.9855, "New York", 90, True, 12, ["Universal Hero", "Gold Donor"]),  # Times Square
            ("Elena Rostova", BloodType.A_POS, 40.7128, -74.0060, "New York", 120, True, 8, ["Frequent Giver"]),  # City Hall
            ("Marcus Vance", BloodType.O_POS, 40.7831, -73.9712, "New York", 75, True, 5, ["Life Saver"]),  # Upper West Side
            ("Sophia Chen", BloodType.B_POS, 40.6782, -73.9442, "Brooklyn", 60, True, 4, []),  # Crown Heights
            ("David Miller", BloodType.AB_POS, 40.7282, -73.9942, "New York", 180, True, 15, ["Platinum Donor"]),  # Greenwich Village
            ("Hannah Abbott", BloodType.O_NEG, 40.7484, -73.9857, "New York", 40, False, 6, ["Universal Hero"]),  # Ineligible (<56 days)
            ("Carlos Mendez", BloodType.A_NEG, 40.7061, -74.0092, "Financial District", 100, True, 7, ["Fast Responder"]),
            ("Priya Sharma", BloodType.B_NEG, 40.7527, -73.9772, "Grand Central", 85, True, 3, []),
            ("James O'Connor", BloodType.AB_NEG, 40.8075, -73.9626, "Morningside Heights", 110, True, 9, []),
            ("Rachel Adams", BloodType.O_POS, 40.6892, -74.0445, "Jersey City", 65, True, 2, []),
        ]

        next_user_id = 10
        for name, btype, lat, lon, city, days_ago, ready, total_don, badges in donor_seeds:
            u_id = next_user_id
            next_user_id += 1
            phone_raw = f"+1 555-{1000 + u_id:04d}"
            clean_name = name.lower().replace(' ', '.').replace("'", "")
            email_raw = f"{clean_name}@gmail.com"


            user = User(
                id=u_id,
                name=name,
                email=email_raw,
                phone=phone_raw,
                role=UserRole.DONOR,
                created_at=datetime.now() - timedelta(days= days_ago + 30)
            )
            self.users.append(user)

            last_date = today - timedelta(days=days_ago) if days_ago else None
            next_eligible = last_date + timedelta(days=56) if last_date else today

            donor = DonorProfile(
                user_id=u_id,
                user_name=name,
                blood_type=btype,
                last_donation_date=last_date,
                ready_to_donate=ready,
                location=Location(latitude=lat, longitude=lon, address=f"{city} Central", city=city),
                max_travel_radius_km=35.0,
                phone_masked=privacy_manager.mask_phone(phone_raw),
                email_masked=privacy_manager.mask_email(email_raw),
                phone_unmasked=phone_raw,
                email_unmasked=email_raw,
                next_eligible_date=next_eligible,
                is_eligible=(today >= next_eligible and ready),
                total_donations=total_don,
                badges=badges
            )
            self.donors.append(donor)

        # 4. Seed Initial Urgent Blood Requests
        req1 = BloodRequest(
            id=101,
            requester_id=2,  # Mount Sinai
            requester_name="Mount Sinai Hospital",
            requester_role=UserRole.HOSPITAL,
            patient_name="Emergency Surgery Patient #402",
            blood_type_needed=BloodType.O_NEG,
            units_required=4,
            urgency=UrgencyLevel.CRITICAL,
            location=Location(latitude=40.7890, longitude=-73.9548, address="1468 Madison Ave", city="New York"),
            hospital_name="Mount Sinai Hospital",
            status=RequestStatus.OPEN,
            created_at=datetime.now() - timedelta(hours=2),
            expires_at=datetime.now() + timedelta(hours=22),
            notes="Trauma surgery unit needs universal O- blood immediately.",
            matched_donor_count=2
        )

        req2 = BloodRequest(
            id=102,
            requester_id=3,  # Bellevue
            requester_name="Bellevue Hospital Center",
            requester_role=UserRole.HOSPITAL,
            patient_name="Anemia Patient - ICU Unit 3",
            blood_type_needed=BloodType.A_POS,
            units_required=2,
            urgency=UrgencyLevel.HIGH,
            location=Location(latitude=40.7391, longitude=-73.9754, address="462 1st Ave", city="New York"),
            hospital_name="Bellevue Hospital Center",
            status=RequestStatus.OPEN,
            created_at=datetime.now() - timedelta(hours=5),
            expires_at=datetime.now() + timedelta(hours=19),
            notes="Transfusion needed prior to scheduled procedure.",
            matched_donor_count=3
        )

        self.requests.extend([req1, req2])

        # 5. Seed Active Campaigns
        camp1 = Campaign(
            id=1,
            organizer_id=2,
            title="Metropolitan Summer Emergency Blood Drive 2026",
            organizer_name="Mount Sinai Hospital & Red Cross",
            location=Location(latitude=40.7890, longitude=-73.9548, address="1468 Madison Ave", city="New York"),
            start_date=today,
            end_date=today + timedelta(days=7),
            blood_types_needed=[BloodType.O_NEG, BloodType.O_POS, BloodType.A_POS, BloodType.B_NEG],
            target_units=100,
            units_collected=42,
            description="Urgent community drive to replenish critical trauma unit supplies before holiday weekend. Free health pre-screening & gift vouchers provided.",
            contact_phone="+1 212-241-6500",
            is_active=True,
            created_at=datetime.now() - timedelta(days=2),
            participants_count=38
        )

        camp2 = Campaign(
            id=2,
            organizer_id=3,
            title="Downtown Community LifeSaver Camp",
            organizer_name="Bellevue Hospital Center",
            location=Location(latitude=40.7391, longitude=-73.9754, address="462 1st Ave", city="New York"),
            start_date=today - timedelta(days=1),
            end_date=today + timedelta(days=5),
            blood_types_needed=[BloodType.O_NEG, BloodType.AB_NEG, BloodType.B_POS],
            target_units=60,
            units_collected=28,
            description="Special donation drive focused on rare blood types and emergency reserves. All eligible donors welcome!",
            contact_phone="+1 212-562-4141",
            is_active=True,
            created_at=datetime.now() - timedelta(days=3),
            participants_count=24
        )

        self.campaigns.extend([camp1, camp2])

        # Initial audit log entry
        privacy_manager.log_action(
            user_id=1,
            user_role="ADMIN",
            action="SYSTEM_INIT",
            resource_type="DATABASE",
            resource_id="0",
            details="System database initialized with seeded donor, hospital, and campaign entities."
        )

    def get_donor_by_user_id(self, user_id: int) -> Optional[DonorProfile]:
        for d in self.donors:
            if d.user_id == user_id:
                return d
        return None

    def get_request_by_id(self, request_id: int) -> Optional[BloodRequest]:
        for r in self.requests:
            if r.id == request_id:
                return r
        return None


db = DatabaseStore()
