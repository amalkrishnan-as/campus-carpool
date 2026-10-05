from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.api.v1.deps import get_verified_user
from app.models import User
from app.schemas.misc import NotificationOut
from app.services.misc import NotificationService

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("", response_model=List[NotificationOut])
def get_notifications(
    unread_only: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_verified_user)
):
    return NotificationService.get_notifications(db, current_user.id, unread_only)


@router.get("/unread-count")
def get_unread_count(db: Session = Depends(get_db), current_user: User = Depends(get_verified_user)):
    count = NotificationService.get_unread_count(db, current_user.id)
    return {"count": count}


@router.post("/{notification_id}/read")
def mark_read(notification_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_verified_user)):
    NotificationService.mark_read(db, notification_id, current_user.id)
    return {"message": "Notification marked as read"}


@router.post("/mark-all-read")
def mark_all_read(db: Session = Depends(get_db), current_user: User = Depends(get_verified_user)):
    NotificationService.mark_all_read(db, current_user.id)
    return {"message": "All notifications marked as read"}
