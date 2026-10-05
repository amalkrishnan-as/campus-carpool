from typing import List
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException
from app.models import Rating, RideRequest, Ride, RideStatus, RequestStatus, User
from app.schemas.rating import RatingCreate


class RatingService:

    @staticmethod
    def create_rating(db: Session, ride_id: UUID, reviewer_id: UUID, data: RatingCreate) -> Rating:
        ride = db.query(Ride).filter(Ride.id == ride_id).first()
        if not ride:
            raise HTTPException(status_code=404, detail="Ride not found")

        if ride.status != RideStatus.COMPLETED:
            raise HTTPException(status_code=400, detail="Can only rate after ride is completed")

        reviewed_user_id = data.reviewed_user_id
        if str(reviewer_id) == str(reviewed_user_id):
            raise HTTPException(status_code=400, detail="Cannot rate yourself")

        # Verify both are participants
        is_driver = str(ride.driver_id) == str(reviewer_id)
        is_passenger_reviewer = db.query(RideRequest).filter(
            RideRequest.ride_id == ride_id,
            RideRequest.passenger_id == reviewer_id,
            RideRequest.status == RequestStatus.ACCEPTED
        ).first() is not None

        if not is_driver and not is_passenger_reviewer:
            raise HTTPException(status_code=403, detail="You were not a participant in this ride")

        # Verify reviewed user is also a participant
        reviewed_is_driver = str(ride.driver_id) == str(reviewed_user_id)
        reviewed_is_passenger = db.query(RideRequest).filter(
            RideRequest.ride_id == ride_id,
            RideRequest.passenger_id == reviewed_user_id,
            RideRequest.status == RequestStatus.ACCEPTED
        ).first() is not None

        if not reviewed_is_driver and not reviewed_is_passenger:
            raise HTTPException(status_code=403, detail="Reviewed user was not a participant in this ride")

        # Check duplicate
        existing = db.query(Rating).filter(
            Rating.ride_id == ride_id,
            Rating.reviewer_id == reviewer_id,
            Rating.reviewed_user_id == reviewed_user_id
        ).first()
        if existing:
            raise HTTPException(
                status_code=409,
                detail={"code": "ALREADY_RATED", "message": "You have already rated this user for this ride"}
            )

        rating = Rating(
            ride_id=ride_id,
            reviewer_id=reviewer_id,
            reviewed_user_id=reviewed_user_id,
            rating=data.rating,
            comment=data.comment,
        )
        db.add(rating)

        # Update average rating
        reviewed_user = db.query(User).filter(User.id == reviewed_user_id).first()
        if reviewed_user:
            total = db.query(func.sum(Rating.rating)).filter(Rating.reviewed_user_id == reviewed_user_id).scalar() or 0
            count = db.query(func.count(Rating.id)).filter(Rating.reviewed_user_id == reviewed_user_id).scalar() or 0
            reviewed_user.average_rating = round((total + data.rating) / (count + 1), 2)
            reviewed_user.rating_count = count + 1

        db.commit()
        db.refresh(rating)
        return rating

    @staticmethod
    def get_ride_ratings(db: Session, ride_id: UUID):
        return db.query(Rating).filter(Rating.ride_id == ride_id).all()

    @staticmethod
    def get_user_ratings(db: Session, user_id: UUID):
        return db.query(Rating).filter(Rating.reviewed_user_id == user_id).all()
