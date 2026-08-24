"""
Notification Dispatcher Service.
Simulates Twilio SMS/WhatsApp, Firebase Cloud Messaging (FCM), and Email alerts.
"""

from datetime import datetime
from typing import List, Optional, Dict, Any
from models import Notification, BloodRequest, DonorProfile


class NotificationService:
    def __init__(self):
        self.notifications: List[Notification] = []

    def dispatch_match_alert(
        self,
        donor: DonorProfile,
        request: BloodRequest,
        distance_km: float,
        channel: str = "WhatsApp / Twilio SMS"
    ) -> Notification:
        """
        Sends an urgent dispatch notification to a matched compatible donor.
        """
        title = f"🩸 URGENT BLOOD NEED: {request.blood_type_needed} Nearby ({distance_km} km)"
        message = (
            f"Dear {donor.user_name}, a urgent request for {request.blood_type_needed} blood "
            f"has been posted at {request.location.city} ({request.hospital_name or 'Local Hospital'}). "
            f"Urgency Level: {request.urgency.value}. You are a compatible match located {distance_km} km away. "
            f"Reply 'ACCEPT' or click in-app to confirm your availability."
        )

        notif = Notification(
            id=len(self.notifications) + 1,
            user_id=donor.user_id,
            title=title,
            message=message,
            channel=channel,
            sent_at=datetime.now(),
            read=False,
            payload={
                "request_id": request.id,
                "blood_type": request.blood_type_needed.value,
                "urgency": request.urgency.value,
                "distance_km": distance_km,
                "twilio_sid": f"SM{datetime.now().strftime('%Y%m%d%H%M%S')}{donor.user_id:04d}",
                "status": "DELIVERED"
            }
        )
        self.notifications.append(notif)
        return notif

    def get_user_notifications(self, user_id: int) -> List[Notification]:
        return [n for n in self.notifications if n.user_id == user_id]

    def mark_as_read(self, notification_id: int) -> bool:
        for n in self.notifications:
            if n.id == notification_id:
                n.read = True
                return True
        return False

    def dispatch_security_login_email(
        self,
        user_name: str,
        email: str,
        provider: str = "Google",
        ip_address: str = "127.0.0.1 (Localhost)",
        location: str = "Chennai, Tamil Nadu, India",
        device: str = "Chrome / Windows 11"
    ) -> Notification:
        """
        Sends an automated security email notification upon successful account login.
        """
        now_str = datetime.now().strftime("%d %b %Y, %I:%M %p")
        title = f"🔐 Security Alert: New Sign-in to LifePulse from {device}"
        message = (
            f"Dear {user_name},\n\n"
            f"Your Google account ({email}) was just used to sign in to LifePulse.\n\n"
            f"📌 Session Details:\n"
            f"• Provider: {provider} Account Verified\n"
            f"• Date & Time: {now_str}\n"
            f"• Device / Browser: {device}\n"
            f"• Approximate Location: {location}\n"
            f"• IP Address: {ip_address}\n\n"
            f"If this was you, no action is needed. If you did not sign in, please secure your account immediately."
        )

        notif = Notification(
            id=len(self.notifications) + 1,
            user_id=10,
            title=title,
            message=message,
            channel=f"Email ({email})",
            sent_at=datetime.now(),
            read=False,
            payload={
                "email": email,
                "provider": provider,
                "device": device,
                "location": location,
                "ip": ip_address,
                "status": "SENT"
            }
        )
        self.notifications.insert(0, notif)
        return notif

    def broadcast_donor_update(
        self,
        donor_name: str,
        blood_group: str,
        city: str,
        action: str = "registered"
    ) -> Notification:
        """
        Pushes a real-time broadcast notification to other active users about a donor update.
        """
        title = f"🩸 Donor Update: {donor_name} ({blood_group})"
        message = (
            f"{donor_name} has just {action} as a verified {blood_group} blood donor in {city}. "
            f"Ready for instant emergency matching!"
        )
        notif = Notification(
            id=len(self.notifications) + 1,
            user_id=0,  # 0 denotes global broadcast to all users
            title=title,
            message=message,
            channel="Live Push Alert",
            sent_at=datetime.now(),
            read=False,
            payload={
                "type": "DONOR_UPDATE",
                "donor_name": donor_name,
                "blood_group": blood_group,
                "city": city,
                "action": action
            }
        )
        self.notifications.insert(0, notif)
        return notif

    def broadcast_campaign_update(
        self,
        campaign_title: str,
        organizer: str,
        city: str,
        blood_types: str,
        action: str = "created"
    ) -> Notification:
        """
        Pushes a real-time broadcast notification to other active users about a campaign drive update.
        """
        title = f"📢 Campaign Alert: {campaign_title}"
        message = (
            f"Drive {action} by {organizer} in {city}. "
            f"Needed Blood Types: {blood_types}. Join and participate to save lives!"
        )
        notif = Notification(
            id=len(self.notifications) + 1,
            user_id=0,  # 0 denotes global broadcast
            title=title,
            message=message,
            channel="Community Broadcast",
            sent_at=datetime.now(),
            read=False,
            payload={
                "type": "CAMPAIGN_UPDATE",
                "title": campaign_title,
                "organizer": organizer,
                "city": city,
                "blood_types": blood_types,
                "action": action
            }
        )
        self.notifications.insert(0, notif)
        return notif


notification_service = NotificationService()

