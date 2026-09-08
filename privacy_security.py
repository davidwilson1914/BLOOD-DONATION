"""
Privacy, HIPAA/GDPR Compliance, and Contact Masking Engine.
"""

from datetime import datetime
from typing import List, Optional
from models import AuditLog, DonorProfile, MatchResponseStatus


class PrivacySecurityManager:
    def __init__(self):
        self.audit_logs: List[AuditLog] = []

    def log_action(
        self,
        user_id: int,
        user_role: str,
        action: str,
        resource_type: str,
        resource_id: str,
        details: str,
        ip_address: str = "127.0.0.1"
    ) -> AuditLog:
        """Records an immutable HIPAA/GDPR audit log entry."""
        log_entry = AuditLog(
            id=len(self.audit_logs) + 1,
            user_id=user_id,
            user_role=user_role,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            details=details,
            timestamp=datetime.now(),
            ip_address=ip_address
        )
        self.audit_logs.append(log_entry)
        return log_entry

    def mask_phone(self, phone: str) -> str:
        """Masks phone number for privacy, showing only country code and last 4 digits."""
        if not phone or len(phone) < 7:
            return "+1 ***-***-0000"
        return f"{phone[:3]} ***-***-{phone[-4:]}"

    def mask_email(self, email: str) -> str:
        """Masks email address for privacy (e.g. j***n@example.com)."""
        if "@" not in email:
            return "d***r@privacy.org"
        name, domain = email.split("@", 1)
        if len(name) <= 2:
            masked_name = name[0] + "*"
        else:
            masked_name = name[0] + "*" * (len(name) - 2) + name[-1]
        return f"{masked_name}@{domain}"

    def get_sanitized_donor_profile(
        self,
        donor: DonorProfile,
        request_match_status: Optional[MatchResponseStatus] = None
    ) -> DonorProfile:
        """
        Applies privacy controls. Contact info is only disclosed if the match is ACCEPTED.
        Otherwise, contact details remain anonymized/masked.
        """
        sanitized = donor.model_copy()

        # Mask contacts by default
        sanitized.phone_masked = self.mask_phone(donor.phone_unmasked or "+15550192834")
        sanitized.email_masked = self.mask_email(donor.email_unmasked or "donor@lifepulse.org")

        if request_match_status == MatchResponseStatus.ACCEPTED:
            # Mutual consent reached: reveal contact details
            sanitized.phone_unmasked = donor.phone_unmasked
            sanitized.email_unmasked = donor.email_unmasked
        else:
            # Privacy protection active: hide unmasked fields
            sanitized.phone_unmasked = None
            sanitized.email_unmasked = None

        return sanitized


privacy_manager = PrivacySecurityManager()
