from pydantic import BaseModel, EmailStr, field_validator, UUID4
from typing import Optional
from datetime import datetime
from app.models import UserRole, UserStatus


class UserBase(BaseModel):
    name: str
    email: EmailStr
    college_id: Optional[str] = None
    department: Optional[str] = None
    year: Optional[int] = None
    phone: Optional[str] = None


class UserCreate(UserBase):
    password: str

    @field_validator("password")
    @classmethod
    def password_strength(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v


class UserUpdate(BaseModel):
    name: Optional[str] = None
    college_id: Optional[str] = None
    department: Optional[str] = None
    year: Optional[int] = None
    phone: Optional[str] = None
    profile_image_url: Optional[str] = None


class UserOut(BaseModel):
    id: UUID4
    name: str
    email: str
    college_id: Optional[str] = None
    department: Optional[str] = None
    year: Optional[int] = None
    phone: Optional[str] = None
    profile_image_url: Optional[str] = None
    role: UserRole
    status: UserStatus
    average_rating: float = 0.0
    rating_count: int = 0
    created_at: datetime

    model_config = {"from_attributes": True}


class UserPublic(BaseModel):
    """Safe public view of user - no email, phone etc."""
    id: UUID4
    name: str
    department: Optional[str] = None
    year: Optional[int] = None
    profile_image_url: Optional[str] = None
    average_rating: float = 0.0
    rating_count: int = 0

    model_config = {"from_attributes": True}


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def password_strength(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v
