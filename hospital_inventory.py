"""
Hospital Blood Bank Inventory Tracker.
Monitors blood stock levels and auto-dispatches urgent blood requests when stock falls below critical thresholds.
"""

from datetime import datetime
from typing import Dict, List, Optional, Tuple
from models import BloodType, InventoryItem, BloodRequestCreate, UrgencyLevel, Location


class HospitalInventoryManager:
    def __init__(self):
        # Map: hospital_id -> list of InventoryItem
        self.inventories: Dict[int, List[InventoryItem]] = {}

    def initialize_hospital_inventory(self, hospital_id: int):
        """Initializes default stock matrix for all 8 blood types for a hospital."""
        stock = [
            InventoryItem(blood_type=BloodType.A_POS, units_available=12, min_threshold=5, last_updated=datetime.now()),
            InventoryItem(blood_type=BloodType.A_NEG, units_available=4, min_threshold=3, last_updated=datetime.now()),
            InventoryItem(blood_type=BloodType.B_POS, units_available=8, min_threshold=5, last_updated=datetime.now()),
            InventoryItem(blood_type=BloodType.B_NEG, units_available=2, min_threshold=3, last_updated=datetime.now()),
            InventoryItem(blood_type=BloodType.AB_POS, units_available=6, min_threshold=4, last_updated=datetime.now()),
            InventoryItem(blood_type=BloodType.AB_NEG, units_available=1, min_threshold=2, last_updated=datetime.now()),
            InventoryItem(blood_type=BloodType.O_POS, units_available=15, min_threshold=8, last_updated=datetime.now()),
            InventoryItem(blood_type=BloodType.O_NEG, units_available=2, min_threshold=4, last_updated=datetime.now()),
        ]
        self.inventories[hospital_id] = stock

    def get_inventory(self, hospital_id: int) -> List[InventoryItem]:
        if hospital_id not in self.inventories:
            self.initialize_hospital_inventory(hospital_id)
        return self.inventories[hospital_id]

    def update_stock(
        self,
        hospital_id: int,
        blood_type: BloodType,
        units_available: int
    ) -> Tuple[InventoryItem, Optional[BloodRequestCreate]]:
        """
        Updates stock count. If stock falls below min threshold, returns an auto-generated
        BloodRequestCreate payload to trigger immediate donor notifications.
        """
        items = self.get_inventory(hospital_id)
        auto_request = None

        for item in items:
            if item.blood_type == blood_type:
                item.units_available = units_available
                item.last_updated = datetime.now()

                # Check low stock threshold alert
                if units_available < item.min_threshold:
                    needed_units = item.min_threshold * 2 - units_available
                    auto_request = BloodRequestCreate(
                        patient_name=f"Hospital Low Stock Replenishment ({blood_type.value})",
                        blood_type_needed=blood_type,
                        units_required=needed_units,
                        urgency=UrgencyLevel.CRITICAL if units_available <= 1 else UrgencyLevel.HIGH,
                        location=Location(latitude=40.7128, longitude=-74.0060, address="Central Hospital", city="New York"),
                        hospital_name="Central Hospital",
                        notes=f"AUTOMATED SYSTEM ALERT: Inventory fell to {units_available} units (min threshold: {item.min_threshold})."
                    )
                return item, auto_request

        raise ValueError(f"Blood type {blood_type} not found in inventory.")


inventory_manager = HospitalInventoryManager()
