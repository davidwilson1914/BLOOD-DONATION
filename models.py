"""
Data models and Pydantic schemas for LifePulse Blood Donor Platform.
"""

from enum import Enum
from typing import Optional, List
from datetime import datetime, date
from pydantic import BaseModel, EmailStr, Field, ConfigDict


class UserRole(str, Enum):
    DONOR = "donor"
    SEEKER = "seeker"
    HOSPITAL = "hospital"
    ADMIN = "admin"



class BloodType(str, Enum):
    A_POS = "A+"
    A_NEG = "A-"
    B_POS = "B+"
    B_NEG = "B-"
    AB_POS = "AB+"
    AB_NEG = "AB-"
    O_POS = "O+"
    O_NEG = "O-"


class UrgencyLevel(str, Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


class RequestStatus(str, Enum):
    OPEN = "OPEN"
    MATCHED = "MATCHED"
    FULFILLED = "FULFILLED"
    CANCELLED = "CANCELLED"


class MatchResponseStatus(str, Enum):
    PENDING = "PENDING"
    ACCEPTED = "ACCEPTED"
    DECLINED = "DECLINED"


# --- Location Schema ---
class Location(BaseModel):
    latitude: float
    longitude: float
    address: str
    city: str


# --- User Schemas ---
class UserBase(BaseModel):
    name: str
    email: EmailStr
    phone: str
    role: UserRole


class UserCreate(UserBase):
    password: str


class User(UserBase):
    id: int
    created_at: datetime
    is_verified: bool = True

    model_config = ConfigDict(from_attributes=True)




# --- Donor Schemas ---
class DonorProfileBase(BaseModel):
    blood_type: BloodType
    last_donation_date: Optional[date] = None
    ready_to_donate: bool = True
    location: Location
    max_travel_radius_km: float = 30.0
    medical_eligibility_notes: Optional[str] = None


class DonorProfile(DonorProfileBase):
    user_id: int
    user_name: str
    phone_masked: str
    email_masked: str
    phone_unmasked: Optional[str] = None
    email_unmasked: Optional[str] = None
    next_eligible_date: date
    is_eligible: bool = True
    total_donations: int = 0
    badges: List[str] = []


class DonorRegisterCreate(BaseModel):
    name: str
    email: EmailStr
    phone: str
    blood_type: BloodType
    location: Location
    last_donation_date: Optional[date] = None
    is_first_time_donor: bool = False
    max_travel_radius_km: float = 30.0
    age: Optional[int] = 25
    weight_kg: Optional[float] = 65.0
    preferred_notification_channel: str = "WhatsApp / SMS"
    medical_notes: Optional[str] = None



# --- Hospital Schemas ---
class HospitalBase(BaseModel):
    name: str
    license_number: str
    address: str
    location: Location
    contact_phone: str
    verified: bool = True


class Hospital(HospitalBase):
    id: int
    user_id: int


class InventoryItem(BaseModel):
    blood_type: BloodType
    units_available: int
    min_threshold: int = 5
    last_updated: datetime


# --- Blood Request Schemas ---
class BloodRequestCreate(BaseModel):
    patient_name: str
    blood_type_needed: BloodType
    units_required: int
    urgency: UrgencyLevel
    location: Location
    hospital_name: Optional[str] = None
    notes: Optional[str] = None


class BloodRequest(BloodRequestCreate):
    id: int
    requester_id: int
    requester_name: str
    requester_role: UserRole
    status: RequestStatus = RequestStatus.OPEN
    created_at: datetime
    expires_at: datetime
    matched_donor_count: int = 0


# --- Match & Response Schemas ---
class MatchResponse(BaseModel):
    id: int
    request_id: int
    donor_id: int
    donor_name: str
    donor_blood_type: BloodType
    distance_km: float
    match_score: float
    status: MatchResponseStatus = MatchResponseStatus.PENDING
    created_at: datetime
    responded_at: Optional[datetime] = None
    unlocked_contact_phone: Optional[str] = None
    unlocked_contact_email: Optional[str] = None


# --- Notification Schemas ---
class Notification(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    channel: str  # SMS, WhatsApp, FCM Push, Email
    sent_at: datetime
    read: bool = False
    payload: Optional[dict] = None


# --- Audit Log Schema ---
class AuditLog(BaseModel):
    id: int
    user_id: int
    user_role: str
    action: str
    resource_type: str
    resource_id: str
    details: str
    timestamp: datetime
    ip_address: str = "127.0.0.1"


# --- Campaign Schemas ---
class CampaignCreate(BaseModel):
    id: Optional[int] = None
    title: str
    organizer_name: str
    location: Location
    start_date: date
    end_date: date
    blood_types_needed: List[BloodType]
    target_units: int = 50
    units_collected: int = 0
    description: str
    contact_phone: str


class Campaign(CampaignCreate):
    id: int
    organizer_id: int
    is_active: bool = True
    created_at: datetime
    participants_count: int = 0

