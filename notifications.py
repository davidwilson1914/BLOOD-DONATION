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


notification_service = NotificationService()
