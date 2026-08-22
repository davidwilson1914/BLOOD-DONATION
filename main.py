"""
LifePulse Blood Donor Matching Platform - Main FastAPI Application.
"""

from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import FastAPI, HTTPException, Query, Depends, status
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, Response

import config
from models import (
    User, UserRole, DonorProfile, DonorRegisterCreate, BloodRequest, BloodRequestCreate,
    MatchResponse, MatchResponseStatus, Notification, AuditLog,
    InventoryItem, RequestStatus, BloodType, Location, Campaign, CampaignCreate
)
from database import db
from matching_engine import find_matching_donors, haversine_distance, COMPATIBILITY_MATRIX
from privacy_security import privacy_manager
from notifications import notification_service
from hospital_inventory import inventory_manager

app = FastAPI(
    title=config.APP_NAME,
    description="Full-stack Python Blood Donor Matching Platform API with Geospatial Indexing, Privacy Controls & HIPAA Audit Logs.",
    version="1.0.0"
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- 1. Authentication & Role Utilities ---
@app.get("/api/auth/users", response_model=List[User])
def get_mock_users():
    """Returns available demo user accounts for rapid multi-role switching."""
    return db.users


# --- 2. Donor Profile & Location Endpoints ---
@app.post("/api/donors/register", response_model=DonorProfile)
def register_new_donor(reg_in: DonorRegisterCreate):
    """
    Registers a new donor with personal details, blood group, contact info,
    location, medical eligibility pre-screening, and preferences.
    """
    from datetime import date
    new_u_id = max([u.id for u in db.users] or [100]) + 1

    # 1. Create User
    new_user = User(
        id=new_u_id,
        name=reg_in.name,
        email=reg_in.email,
        phone=reg_in.phone,
        role=UserRole.DONOR,
        created_at=datetime.now()
    )
    db.users.append(new_user)

    # 2. Calculate next eligible date
    today = date.today()
    if reg_in.is_first_time_donor or not reg_in.last_donation_date:
        last_date = None
        next_eligible = today
    else:
        last_date = reg_in.last_donation_date
        next_eligible = last_date + timedelta(days=56)

    is_eligible = (today >= next_eligible)

    # 3. Create Donor Profile
    new_donor = DonorProfile(
        user_id=new_u_id,
        user_name=reg_in.name,
        blood_type=reg_in.blood_type,
        last_donation_date=last_date,
        ready_to_donate=True,
        location=reg_in.location,
        max_travel_radius_km=reg_in.max_travel_radius_km,
        phone_masked=privacy_manager.mask_phone(reg_in.phone),
        email_masked=privacy_manager.mask_email(reg_in.email),
        phone_unmasked=reg_in.phone,
        email_unmasked=reg_in.email,
        next_eligible_date=next_eligible,
        is_eligible=is_eligible,
        total_donations=0 if reg_in.is_first_time_donor else 1,
        badges=["New Hero"],
        medical_eligibility_notes=f"Age: {reg_in.age}, Weight: {reg_in.weight_kg}kg, Pref: {reg_in.preferred_notification_channel}. {reg_in.medical_notes or ''}"
    )
    db.donors.append(new_donor)

    # 4. HIPAA Audit Log
    privacy_manager.log_action(
        user_id=new_u_id,
        user_role="DONOR",
        action="REGISTER_DONOR",
        resource_type="DONOR_PROFILE",
        resource_id=str(new_u_id),
        details=f"Registered new {reg_in.blood_type.value} donor: {reg_in.name} in {reg_in.location.city}"
    )

    return new_donor

@app.get("/api/donors", response_model=List[DonorProfile])
def list_donors(
    current_user_id: int = Query(1),
    current_user_role: str = Query("ADMIN")
):
    """
    Lists all donor profiles. Applies privacy masking unless accessed by Admin or mutual match.
    """
    privacy_manager.log_action(
        user_id=current_user_id,
        user_role=current_user_role,
        action="LIST_DONORS",
        resource_type="DONOR_PROFILE",
        resource_id="ALL",
        details="Queried donor list"
    )
    return [privacy_manager.get_sanitized_donor_profile(d) for d in db.donors]


@app.get("/api/donors/{user_id}", response_model=DonorProfile)
def get_donor_profile(user_id: int, requester_user_id: int = Query(1), requester_role: str = Query("DONOR")):
    donor = db.get_donor_by_user_id(user_id)
    if not donor:
        raise HTTPException(status_code=404, detail="Donor profile not found")

    privacy_manager.log_action(
        user_id=requester_user_id,
        user_role=requester_role,
        action="VIEW_DONOR_PROFILE",
        resource_type="DONOR_PROFILE",
        resource_id=str(user_id),
        details=f"Viewed profile of donor {donor.user_name}"
    )
    return privacy_manager.get_sanitized_donor_profile(donor)


@app.post("/api/donors/{user_id}/toggle-availability")
def toggle_donor_availability(user_id: int, ready_to_donate: bool):
    donor = db.get_donor_by_user_id(user_id)
    if not donor:
        raise HTTPException(status_code=404, detail="Donor profile not found")

    donor.ready_to_donate = ready_to_donate
    privacy_manager.log_action(
        user_id=user_id,
        user_role="DONOR",
        action="TOGGLE_AVAILABILITY",
        resource_type="DONOR_PROFILE",
        resource_id=str(user_id),
        details=f"Set ready_to_donate to {ready_to_donate}"
    )
    return {"status": "success", "user_id": user_id, "ready_to_donate": ready_to_donate}


# --- 3. Blood Request & Matching Endpoints ---
@app.get("/api/requests", response_model=List[BloodRequest])
def list_requests(status_filter: Optional[RequestStatus] = None):
    """Returns active or filtered blood requests."""
    if status_filter:
        return [r for r in db.requests if r.status == status_filter]
    return db.requests


@app.post("/api/requests", response_model=BloodRequest)
def create_blood_request(
    request_in: BloodRequestCreate,
    requester_id: int = Query(2),
    requester_role: UserRole = Query(UserRole.HOSPITAL)
):
    """
    Creates a new urgent blood request, immediately invokes the matching engine,
    and dispatches simulated Twilio/FCM alerts to compatible nearby donors.
    """
    requester_name = "Mount Sinai Hospital"
    for u in db.users:
        if u.id == requester_id:
            requester_name = u.name

    new_id = len(db.requests) + 101
    new_request = BloodRequest(
        id=new_id,
        requester_id=requester_id,
        requester_name=requester_name,
        requester_role=requester_role,
        patient_name=request_in.patient_name,
        blood_type_needed=request_in.blood_type_needed,
        units_required=request_in.units_required,
        urgency=request_in.urgency,
        location=request_in.location,
        hospital_name=request_in.hospital_name,
        status=RequestStatus.OPEN,
        created_at=datetime.now(),
        expires_at=datetime.now() + timedelta(hours=24),
        notes=request_in.notes
    )
    db.requests.append(new_request)

    # Trigger Matching Engine
    matched_candidates = find_matching_donors(new_request, db.donors, max_radius_km=50.0)
    new_request.matched_donor_count = len(matched_candidates)

    # Generate Matches & Dispatch Notifications
    for donor, dist_km, score in matched_candidates:
        match_id = len(db.matches) + 1
        match_record = MatchResponse(
            id=match_id,
            request_id=new_request.id,
            donor_id=donor.user_id,
            donor_name=donor.user_name,
            donor_blood_type=donor.blood_type,
            distance_km=dist_km,
            match_score=score,
            status=MatchResponseStatus.PENDING,
            created_at=datetime.now()
        )
        db.matches.append(match_record)

        # Dispatch Alert Notification
        notification_service.dispatch_match_alert(donor, new_request, dist_km)

    privacy_manager.log_action(
        user_id=requester_id,
        user_role=requester_role.value.upper(),
        action="CREATE_BLOOD_REQUEST",
        resource_type="BLOOD_REQUEST",
        resource_id=str(new_id),
        details=f"Created request for {request_in.blood_type_needed} blood (Urgency: {request_in.urgency.value}). Matched {len(matched_candidates)} donors."
    )

    return new_request


@app.get("/api/requests/{request_id}/matches", response_model=List[MatchResponse])
def get_request_matches(request_id: int):
    """Returns candidate matches for a specific blood request."""
    return [m for m in db.matches if m.request_id == request_id]


@app.post("/api/matches/{match_id}/respond")
def respond_to_match(
    match_id: int,
    action: MatchResponseStatus,
    donor_id: int = Query(...)
):
    """
    Donor accepts or declines a match request.
    Upon ACCEPT, privacy contact details are revealed to the requester.
    """
    target_match = None
    for m in db.matches:
        if m.id == match_id and m.donor_id == donor_id:
            target_match = m
            break

    if not target_match:
        raise HTTPException(status_code=404, detail="Match record not found for this donor.")

    target_match.status = action
    target_match.responded_at = datetime.now()

    donor = db.get_donor_by_user_id(donor_id)

    if action == MatchResponseStatus.ACCEPTED:
        # Unlock contact information for requester
        if donor:
            target_match.unlocked_contact_phone = donor.phone_unmasked
            target_match.unlocked_contact_email = donor.email_unmasked

        # Update Request Status if matched
        req = db.get_request_by_id(target_match.request_id)
        if req:
            req.status = RequestStatus.MATCHED

    privacy_manager.log_action(
        user_id=donor_id,
        user_role="DONOR",
        action="MATCH_RESPONSE",
        resource_type="MATCH_RESPONSE",
        resource_id=str(match_id),
        details=f"Donor {action.value} match for request #{target_match.request_id}"
    )

    return target_match


# --- 4. Hospital Inventory Endpoints ---
@app.get("/api/hospitals/{hospital_id}/inventory", response_model=List[InventoryItem])
def get_hospital_inventory(hospital_id: int):
    return inventory_manager.get_inventory(hospital_id)


@app.post("/api/hospitals/{hospital_id}/inventory")
def update_hospital_stock(
    hospital_id: int,
    blood_type: BloodType,
    units_available: int
):
    """
    Updates hospital stock. If stock drops below minimum threshold, triggers automatic
    urgent blood request creation and donor notification dispatch.
    """
    item, auto_request = inventory_manager.update_stock(hospital_id, blood_type, units_available)

    auto_req_obj = None
    if auto_request:
        auto_req_obj = create_blood_request(auto_request, requester_id=hospital_id, requester_role=UserRole.HOSPITAL)

    return {
        "status": "updated",
        "inventory_item": item,
        "auto_alert_created": auto_req_obj is not None,
        "auto_request": auto_req_obj
    }


# --- 5. Notifications & Regulatory Audit Logs ---
@app.get("/api/notifications", response_model=List[Notification])
def get_user_notifications(user_id: int = Query(...)):
    return notification_service.get_user_notifications(user_id)


@app.post("/api/notifications/{notification_id}/read")
def mark_notification_read(notification_id: int):
    success = notification_service.mark_as_read(notification_id)
    return {"success": success}


@app.get("/api/admin/audit-logs", response_model=List[AuditLog])
def get_audit_logs(admin_id: int = Query(1)):
    """Access HIPAA & GDPR compliance audit trail (Admin only)."""
    return privacy_manager.audit_logs


# --- 6. Analytics Dashboard Summary ---
@app.get("/api/analytics")
def get_analytics():
    total_donors = len(db.donors)
    eligible_donors = sum(1 for d in db.donors if d.is_eligible and d.ready_to_donate)
    open_requests = sum(1 for r in db.requests if r.status == RequestStatus.OPEN)
    total_matches = len(db.matches)
    accepted_matches = sum(1 for m in db.matches if m.status == MatchResponseStatus.ACCEPTED)
    
    # Calculate total blood donations / donors who donated using this app
    total_donations = sum(getattr(d, 'total_donations', 1) for d in db.donors) + sum(c.units_collected for c in db.campaigns)
    active_campaigns_count = len([c for c in db.campaigns if c.is_active])

    blood_distribution = {}
    for b in BloodType:
        blood_distribution[b.value] = sum(1 for d in db.donors if d.blood_type == b)

    return {
        "total_donors": total_donors,
        "eligible_donors": eligible_donors,
        "open_requests": open_requests,
        "total_matches": total_matches,
        "accepted_matches": accepted_matches,
        "match_success_rate": round((accepted_matches / max(1, total_matches)) * 100, 1),
        "blood_type_distribution": blood_distribution,
        "active_campaigns": active_campaigns_count,
        "donors_donated_count": total_donations
    }


# --- 7. Blood Donation Campaigns Endpoints ---
@app.get("/api/campaigns", response_model=List[Campaign])
def get_active_campaigns(city: Optional[str] = None):
    """Returns active blood donation drives/campaigns near the donor."""
    if city:
        city_lower = city.lower()
        return [c for c in db.campaigns if c.is_active and city_lower in c.location.city.lower()]
    return [c for c in db.campaigns if c.is_active]


@app.post("/api/campaigns", response_model=Campaign)
def create_or_update_campaign(
    camp_in: CampaignCreate,
    organizer_id: int = Query(2),
    organizer_role: str = Query("HOSPITAL")
):
    """
    Creates or updates an active blood donation drive/campaign.
    Immediately alerts matching donors in the area.
    """
    if camp_in.id:
        for c in db.campaigns:
            if c.id == camp_in.id:
                c.title = camp_in.title
                c.organizer_name = camp_in.organizer_name
                c.location = camp_in.location
                c.start_date = camp_in.start_date
                c.end_date = camp_in.end_date
                c.blood_types_needed = camp_in.blood_types_needed
                c.target_units = camp_in.target_units
                c.units_collected = camp_in.units_collected
                c.description = camp_in.description
                c.contact_phone = camp_in.contact_phone
                
                privacy_manager.log_action(
                    user_id=organizer_id,
                    user_role=organizer_role,
                    action="UPDATE_CAMPAIGN",
                    resource_type="CAMPAIGN",
                    resource_id=str(c.id),
                    details=f"Updated Campaign drive: '{c.title}' in {c.location.city}"
                )
                return c

    new_id = max([c.id for c in db.campaigns] or [100]) + 1
    new_campaign = Campaign(
        id=new_id,
        organizer_id=organizer_id,
        title=camp_in.title,
        organizer_name=camp_in.organizer_name,
        location=camp_in.location,
        start_date=camp_in.start_date,
        end_date=camp_in.end_date,
        blood_types_needed=camp_in.blood_types_needed,
        target_units=camp_in.target_units,
        units_collected=camp_in.units_collected,
        description=camp_in.description,
        contact_phone=camp_in.contact_phone,
        is_active=True,
        created_at=datetime.now(),
        participants_count=0
    )
    db.campaigns.insert(0, new_campaign)  # Newest first

    privacy_manager.log_action(
        user_id=organizer_id,
        user_role=organizer_role,
        action="CREATE_CAMPAIGN",
        resource_type="CAMPAIGN",
        resource_id=str(new_id),
        details=f"Created Campaign drive: '{camp_in.title}' in {camp_in.location.city}"
    )

    return new_campaign


@app.post("/api/campaigns/{campaign_id}/join")
def join_campaign(campaign_id: int, donor_id: int = Query(10)):
    """Donor registers commitment to participate in a donation campaign drive."""
    for c in db.campaigns:
        if c.id == campaign_id:
            c.participants_count += 1
            c.units_collected += 1
            privacy_manager.log_action(
                user_id=donor_id,
                user_role="DONOR",
                action="JOIN_CAMPAIGN",
                resource_type="CAMPAIGN",
                resource_id=str(campaign_id),
                details=f"Donor registered to join campaign drive: {c.title}"
            )
            return {"status": "joined", "campaign_id": campaign_id, "participants_count": c.participants_count}
    raise HTTPException(status_code=404, detail="Campaign drive not found")



# Mount Static Files for Web Dashboard
app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/")
def serve_index():
    return FileResponse("static/index.html")


@app.get("/favicon.ico")
def serve_favicon():
    svg_icon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🩸</text></svg>'
    return Response(content=svg_icon, media_type="image/svg+xml")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
