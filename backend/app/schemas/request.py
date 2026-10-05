from pydantic import BaseModel, UUID4
from typing import Optional
from datetime import datetime
from app.models import RequestStatus
from app.schemas.user import UserPublic
from app.schemas.ride import RideOut


class RideRequestCreate(BaseModel):
    pass  # ride_id comes from path param


class RideRequestOut(BaseModel):
    id: UUID4
    ride_id: UUID4
    passenger_id: UUID4
    status: RequestStatus
    created_at: datetime
    updated_at: datetime
    passenger: Optional[UserPublic] = None
    ride: Optional[RideOut] = None

    model_config = {"from_attributes": True}
