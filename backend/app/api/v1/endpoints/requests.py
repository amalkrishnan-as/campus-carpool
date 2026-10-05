from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.api.v1.deps import get_verified_user
from app.models import User
from app.schemas.request import RideRequestOut
from app.services.ride import RequestService

router = APIRouter(prefix="/requests", tags=["requests"])


@router.get("/me", response_model=List[RideRequestOut])
def my_requests(db: Session = Depends(get_db), current_user: User = Depends(get_verified_user)):
    return RequestService.get_my_requests(db, current_user.id)


@router.post("/{request_id}/accept", response_model=RideRequestOut)
def accept_request(request_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_verified_user)):
    return RequestService.accept_request(db, request_id, current_user.id)


@router.post("/{request_id}/reject", response_model=RideRequestOut)
def reject_request(request_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_verified_user)):
    return RequestService.reject_request(db, request_id, current_user.id)


@router.post("/{request_id}/cancel", response_model=RideRequestOut)
def cancel_request(request_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_verified_user)):
    return RequestService.cancel_request(db, request_id, current_user.id)
