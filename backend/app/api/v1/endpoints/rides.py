from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from decimal import Decimal
from app.core.database import get_db
from app.api.v1.deps import get_verified_user
from app.models import User
from app.schemas.ride import RideCreate, RideUpdate, RideOut, RideSearchParams, PaginatedRides
from app.schemas.request import RideRequestOut
from app.schemas.rating import RatingCreate, RatingOut
from app.services.ride import RideService, RequestService
from app.services.rating import RatingService

router = APIRouter(prefix="/rides", tags=["rides"])


@router.get("/search", response_model=PaginatedRides)
def search_rides(
    source: Optional[str] = None,
    destination: Optional[str] = None,
    date: Optional[str] = None,
    vehicle_type: Optional[str] = None,
    min_seats: Optional[int] = None,
    max_contribution: Optional[Decimal] = None,
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db),
):
    params = RideSearchParams(
        source=source, destination=destination, date=date,
        vehicle_type=vehicle_type, min_seats=min_seats,
        max_contribution=max_contribution, page=page, page_size=page_size
    )
    return RideService.search_rides(db, params)


@router.get("/my", response_model=List[RideOut])
def my_rides(db: Session = Depends(get_db), current_user: User = Depends(get_verified_user)):
    return RideService.get_my_rides(db, current_user.id)


@router.post("", response_model=RideOut, status_code=201)
def create_ride(data: RideCreate, db: Session = Depends(get_db), current_user: User = Depends(get_verified_user)):
    return RideService.create_ride(db, current_user.id, data)


@router.get("/{ride_id}", response_model=RideOut)
def get_ride(ride_id: str, db: Session = Depends(get_db)):
    return RideService.get_ride(db, ride_id)


@router.patch("/{ride_id}", response_model=RideOut)
def update_ride(ride_id: str, data: RideUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_verified_user)):
    return RideService.update_ride(db, ride_id, current_user.id, data)


@router.post("/{ride_id}/cancel", response_model=RideOut)
def cancel_ride(ride_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_verified_user)):
    return RideService.cancel_ride(db, ride_id, current_user.id)


@router.post("/{ride_id}/start", response_model=RideOut)
def start_ride(ride_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_verified_user)):
    return RideService.start_ride(db, ride_id, current_user.id)


@router.post("/{ride_id}/complete", response_model=RideOut)
def complete_ride(ride_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_verified_user)):
    return RideService.complete_ride(db, ride_id, current_user.id)


@router.post("/{ride_id}/requests", response_model=RideRequestOut, status_code=201)
def request_ride(ride_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_verified_user)):
    return RequestService.create_request(db, ride_id, current_user.id)


@router.get("/{ride_id}/requests", response_model=List[RideRequestOut])
def get_ride_requests(ride_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_verified_user)):
    return RequestService.get_ride_requests(db, ride_id, current_user.id)


@router.post("/{ride_id}/ratings", response_model=RatingOut, status_code=201)
def rate_ride_participant(ride_id: str, data: RatingCreate, db: Session = Depends(get_db), current_user: User = Depends(get_verified_user)):
    return RatingService.create_rating(db, ride_id, current_user.id, data)


@router.get("/{ride_id}/ratings", response_model=List[RatingOut])
def get_ride_ratings(ride_id: str, db: Session = Depends(get_db)):
    return RatingService.get_ride_ratings(db, ride_id)
