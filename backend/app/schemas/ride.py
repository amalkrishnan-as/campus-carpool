from pydantic import BaseModel, UUID4, field_validator
from typing import Optional, List
from datetime import datetime
from decimal import Decimal
from app.models import RideStatus
from app.schemas.user import UserPublic
from app.schemas.vehicle import VehicleOut


class RideCreate(BaseModel):
    vehicle_id: Optional[UUID4] = None
    source: str
    destination: str
    pickup_point: str
    departure_date: str  # YYYY-MM-DD
    departure_time: str  # HH:MM
    available_seats: int
    contribution: Decimal = Decimal("0")
    notes: Optional[str] = None
    source_latitude: Optional[float] = None
    source_longitude: Optional[float] = None
    destination_latitude: Optional[float] = None
    destination_longitude: Optional[float] = None

    @field_validator("available_seats")
    @classmethod
    def seats_positive(cls, v):
        if v <= 0:
            raise ValueError("Seats must be positive")
        return v

    @field_validator("contribution")
    @classmethod
    def contribution_non_negative(cls, v):
        if v < 0:
            raise ValueError("Contribution cannot be negative")
        return v


class RideUpdate(BaseModel):
    pickup_point: Optional[str] = None
    departure_date: Optional[str] = None
    departure_time: Optional[str] = None
    available_seats: Optional[int] = None
    contribution: Optional[Decimal] = None
    notes: Optional[str] = None


class RideOut(BaseModel):
    id: UUID4
    driver_id: UUID4
    vehicle_id: Optional[UUID4] = None
    source: str
    destination: str
    pickup_point: str
    departure_date: str
    departure_time: str
    original_seats: int
    available_seats: int
    contribution: Decimal
    notes: Optional[str] = None
    status: RideStatus
    created_at: datetime
    driver: Optional[UserPublic] = None
    vehicle: Optional[VehicleOut] = None

    model_config = {"from_attributes": True}


class RideSearchParams(BaseModel):
    source: Optional[str] = None
    destination: Optional[str] = None
    date: Optional[str] = None
    vehicle_type: Optional[str] = None
    min_seats: Optional[int] = None
    max_contribution: Optional[Decimal] = None
    page: int = 1
    page_size: int = 20


class PaginatedRides(BaseModel):
    items: List[RideOut]
    total: int
    page: int
    page_size: int
    total_pages: int
