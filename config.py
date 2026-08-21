"""
Configuration settings for the Blood Donor Matching Platform.
"""

import os

# Platform Settings
APP_NAME = "LifePulse - Blood Donor Matching Platform"
API_PREFIX = "/api"
SECRET_KEY = os.getenv("SECRET_KEY", "lifepulse-secret-key-2026-secure-token")

# Matching Algorithm Weights
WEIGHT_DISTANCE = 0.50
WEIGHT_URGENCY = 0.35
WEIGHT_RECENCY = 0.15

# Default Search Parameters
DEFAULT_MAX_RADIUS_KM = 50.0
MIN_DONATION_INTERVAL_DAYS = 56  # 8 weeks standard interval

# Urgency Penalties (lower penalty = higher rank priority)
URGENCY_WEIGHTS = {
    "CRITICAL": 0.0,
    "HIGH": 10.0,
    "MEDIUM": 25.0,
    "LOW": 45.0
}

# HIPAA / GDPR Compliance Settings
ANONYMIZE_CONTACTS_DEFAULT = True
ENABLE_AUDIT_LOGGING = True
DATA_RETENTION_DAYS = 365
