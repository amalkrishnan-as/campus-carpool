from pydantic import BaseModel, UUID4
from typing import Optional
from datetime import datetime


class VehicleCreate(BaseModel):
    type: str
    model: str
    registration_number: str
    seat_capacity: int


class VehicleUpdate(BaseModel):
    type: Optional[str] = None
    model: Optional[str] = None
    registration_number: Optional[str] = None
    seat_capacity: Optional[int] = None


class VehicleOut(BaseModel):
    id: UUID4
    owner_id: UUID4
    type: str
    model: str
    registration_number: str
    seat_capacity: int
    created_at: datetime

    model_config = {"from_attributes": True}
