from pydantic import BaseModel, UUID4, field_validator
from typing import Optional
from datetime import datetime


class RatingCreate(BaseModel):
    reviewed_user_id: UUID4
    rating: int
    comment: Optional[str] = None

    @field_validator("rating")
    @classmethod
    def rating_range(cls, v):
        if not (1 <= v <= 5):
            raise ValueError("Rating must be between 1 and 5")
        return v


class RatingOut(BaseModel):
    id: UUID4
    ride_id: UUID4
    reviewer_id: UUID4
    reviewed_user_id: UUID4
    rating: int
    comment: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}
