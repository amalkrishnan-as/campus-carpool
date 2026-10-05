from pydantic import BaseModel, UUID4
from typing import Optional, List
from datetime import datetime
from app.models import ReportReason, ReportStatus, NotificationType


class NotificationOut(BaseModel):
    id: UUID4
    user_id: UUID4
    type: NotificationType
    title: str
    message: str
    ride_id: Optional[UUID4] = None
    request_id: Optional[UUID4] = None
    is_read: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class ReportCreate(BaseModel):
    reported_user_id: UUID4
    ride_id: Optional[UUID4] = None
    reason: ReportReason
    description: Optional[str] = None


class ReportOut(BaseModel):
    id: UUID4
    reporter_id: UUID4
    reported_user_id: UUID4
    ride_id: Optional[UUID4] = None
    reason: ReportReason
    description: Optional[str] = None
    status: ReportStatus
    admin_notes: Optional[str] = None
    created_at: datetime
    resolved_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class ReportUpdate(BaseModel):
    status: Optional[ReportStatus] = None
    admin_notes: Optional[str] = None


class BlockOut(BaseModel):
    id: UUID4
    blocker_id: UUID4
    blocked_id: UUID4
    created_at: datetime

    model_config = {"from_attributes": True}


class AdminAnalytics(BaseModel):
    total_users: int
    active_users: int
    total_rides: int
    active_rides: int
    completed_rides: int
    total_requests: int
    accepted_requests: int
    open_reports: int
