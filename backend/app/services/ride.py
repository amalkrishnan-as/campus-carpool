from typing import List, Optional
from uuid import UUID
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models import (
    Ride, RideRequest, RideStatus, RequestStatus, Notification, NotificationType, Block, User, Vehicle
)
from app.schemas.ride import RideCreate, RideUpdate, RideSearchParams
from app.schemas.misc import NotificationOut
from datetime import datetime, timezone, date


def _check_blocked(db: Session, user_a_id: UUID, user_b_id: UUID):
    block = db.query(Block).filter(
        ((Block.blocker_id == user_a_id) & (Block.blocked_id == user_b_id)) |
        ((Block.blocker_id == user_b_id) & (Block.blocked_id == user_a_id))
    ).first()
    return block is not None


def _create_notification(db: Session, user_id: UUID, ntype: NotificationType, title: str, message: str,
                          ride_id=None, request_id=None):
    notif = Notification(
        user_id=user_id,
        type=ntype,
        title=title,
        message=message,
        ride_id=ride_id,
        request_id=request_id,
    )
    db.add(notif)


class RideService:

    @staticmethod
    def create_ride(db: Session, driver_id: UUID, data: RideCreate) -> Ride:
        # Validate vehicle belongs to driver
        if data.vehicle_id:
            vehicle = db.query(Vehicle).filter(
                Vehicle.id == data.vehicle_id,
                Vehicle.owner_id == driver_id
            ).first()
            if not vehicle:
                raise HTTPException(status_code=404, detail="Vehicle not found or does not belong to you")

        # Validate date not in past
        try:
            departure_date = datetime.strptime(data.departure_date, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format (YYYY-MM-DD)")
        if departure_date < date.today():
            raise HTTPException(status_code=400, detail="Departure date cannot be in the past")

        ride = Ride(
            driver_id=driver_id,
            vehicle_id=data.vehicle_id,
            source=data.source,
            destination=data.destination,
            pickup_point=data.pickup_point,
            departure_date=data.departure_date,
            departure_time=data.departure_time,
            original_seats=data.available_seats,
            available_seats=data.available_seats,
            contribution=data.contribution,
            notes=data.notes,
            source_latitude=data.source_latitude,
            source_longitude=data.source_longitude,
            destination_latitude=data.destination_latitude,
            destination_longitude=data.destination_longitude,
            status=RideStatus.OPEN,
        )
        db.add(ride)
        db.commit()
        db.refresh(ride)
        return ride

    @staticmethod
    def search_rides(db: Session, params: RideSearchParams, current_user_id: Optional[UUID] = None):
        query = db.query(Ride).filter(
            Ride.status.in_([RideStatus.OPEN, RideStatus.FULL])
        )
        if params.source:
            query = query.filter(Ride.source.ilike(f"%{params.source}%"))
        if params.destination:
            query = query.filter(Ride.destination.ilike(f"%{params.destination}%"))
        if params.date:
            query = query.filter(Ride.departure_date == params.date)
        if params.min_seats:
            query = query.filter(Ride.available_seats >= params.min_seats)
        if params.max_contribution is not None:
            query = query.filter(Ride.contribution <= params.max_contribution)

        # Filter by vehicle type if specified
        if params.vehicle_type:
            query = query.join(Vehicle).filter(Vehicle.type.ilike(f"%{params.vehicle_type}%"))

        total = query.count()
        rides = query.order_by(Ride.departure_date, Ride.departure_time).offset(
            (params.page - 1) * params.page_size
        ).limit(params.page_size).all()

        import math
        return {
            "items": rides,
            "total": total,
            "page": params.page,
            "page_size": params.page_size,
            "total_pages": math.ceil(total / params.page_size) if total > 0 else 0
        }

    @staticmethod
    def get_ride(db: Session, ride_id: UUID) -> Ride:
        ride = db.query(Ride).filter(Ride.id == ride_id).first()
        if not ride:
            raise HTTPException(
                status_code=404,
                detail={"code": "RIDE_NOT_FOUND", "message": "Ride not found"}
            )
        return ride

    @staticmethod
    def update_ride(db: Session, ride_id: UUID, driver_id: UUID, data: RideUpdate) -> Ride:
        ride = RideService.get_ride(db, ride_id)
        if str(ride.driver_id) != str(driver_id):
            raise HTTPException(
                status_code=403,
                detail={"code": "NOT_AUTHORIZED", "message": "You can only edit your own rides"}
            )
        if ride.status in [RideStatus.COMPLETED, RideStatus.CANCELLED, RideStatus.STARTED]:
            raise HTTPException(status_code=400, detail="Cannot edit a completed/cancelled/started ride")

        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(ride, field, value)
        db.commit()
        db.refresh(ride)
        return ride

    @staticmethod
    def cancel_ride(db: Session, ride_id: UUID, driver_id: UUID) -> Ride:
        ride = RideService.get_ride(db, ride_id)
        if str(ride.driver_id) != str(driver_id):
            raise HTTPException(status_code=403, detail={"code": "NOT_AUTHORIZED", "message": "Not authorized"})
        if ride.status in [RideStatus.COMPLETED, RideStatus.CANCELLED]:
            raise HTTPException(status_code=400, detail="Ride already completed or cancelled")

        # Notify accepted passengers
        accepted_requests = db.query(RideRequest).filter(
            RideRequest.ride_id == ride_id,
            RideRequest.status == RequestStatus.ACCEPTED
        ).all()
        for req in accepted_requests:
            _create_notification(
                db, req.passenger_id, NotificationType.RIDE_CANCELLED,
                "Ride Cancelled",
                f"Your ride from {ride.source} to {ride.destination} on {ride.departure_date} has been cancelled by the driver.",
                ride_id=ride_id
            )

        ride.status = RideStatus.CANCELLED
        db.commit()
        db.refresh(ride)
        return ride

    @staticmethod
    def start_ride(db: Session, ride_id: UUID, driver_id: UUID) -> Ride:
        ride = RideService.get_ride(db, ride_id)
        if str(ride.driver_id) != str(driver_id):
            raise HTTPException(status_code=403, detail="Not authorized")
        if ride.status not in [RideStatus.OPEN, RideStatus.FULL]:
            raise HTTPException(status_code=400, detail="Ride cannot be started")
        ride.status = RideStatus.STARTED
        db.commit()
        db.refresh(ride)
        return ride

    @staticmethod
    def complete_ride(db: Session, ride_id: UUID, driver_id: UUID) -> Ride:
        ride = RideService.get_ride(db, ride_id)
        if str(ride.driver_id) != str(driver_id):
            raise HTTPException(status_code=403, detail="Not authorized")
        if ride.status != RideStatus.STARTED:
            raise HTTPException(status_code=400, detail="Ride must be in STARTED state to complete")
        ride.status = RideStatus.COMPLETED

        # Notify all accepted passengers
        accepted_requests = db.query(RideRequest).filter(
            RideRequest.ride_id == ride_id,
            RideRequest.status == RequestStatus.ACCEPTED
        ).all()
        for req in accepted_requests:
            _create_notification(
                db, req.passenger_id, NotificationType.RIDE_COMPLETED,
                "Ride Completed",
                f"Your ride from {ride.source} to {ride.destination} has been completed! Please rate your driver.",
                ride_id=ride_id
            )
        # Notify driver
        _create_notification(
            db, driver_id, NotificationType.RIDE_COMPLETED,
            "Ride Completed",
            f"Your ride from {ride.source} to {ride.destination} has been completed! You can now rate your passengers.",
            ride_id=ride_id
        )
        db.commit()
        db.refresh(ride)
        return ride

    @staticmethod
    def get_my_rides(db: Session, driver_id: UUID):
        return db.query(Ride).filter(Ride.driver_id == driver_id).order_by(Ride.created_at.desc()).all()


class RequestService:

    @staticmethod
    def create_request(db: Session, ride_id: UUID, passenger_id: UUID) -> RideRequest:
        ride = db.query(Ride).filter(Ride.id == ride_id).first()
        if not ride:
            raise HTTPException(status_code=404, detail={"code": "RIDE_NOT_FOUND", "message": "Ride not found"})

        # Cannot request own ride
        if str(ride.driver_id) == str(passenger_id):
            raise HTTPException(status_code=400, detail={"code": "NOT_AUTHORIZED", "message": "Cannot request your own ride"})

        # Check ride status
        if ride.status not in [RideStatus.OPEN, RideStatus.FULL]:
            raise HTTPException(
                status_code=400,
                detail={"code": "RIDE_CANCELLED", "message": "Cannot request this ride"}
            )
        if ride.status == RideStatus.FULL:
            raise HTTPException(status_code=409, detail={"code": "RIDE_FULL", "message": "This ride is full"})

        # Check blocked
        if _check_blocked(db, passenger_id, ride.driver_id):
            raise HTTPException(status_code=403, detail="Cannot interact with this user")

        # Check duplicate
        existing = db.query(RideRequest).filter(
            RideRequest.ride_id == ride_id,
            RideRequest.passenger_id == passenger_id
        ).first()
        if existing:
            raise HTTPException(
                status_code=409,
                detail={"code": "REQUEST_ALREADY_EXISTS", "message": "You have already requested this ride"}
            )

        req = RideRequest(ride_id=ride_id, passenger_id=passenger_id, status=RequestStatus.PENDING)
        db.add(req)
        db.flush()

        passenger = db.query(User).filter(User.id == passenger_id).first()
        _create_notification(
            db, ride.driver_id, NotificationType.RIDE_REQUEST,
            "New Ride Request",
            f"{passenger.name} has requested a seat on your ride from {ride.source} to {ride.destination}.",
            ride_id=ride_id, request_id=req.id
        )
        db.commit()
        db.refresh(req)
        return req

    @staticmethod
    def accept_request(db: Session, request_id: UUID, driver_id: UUID) -> RideRequest:
        req = db.query(RideRequest).filter(RideRequest.id == request_id).with_for_update().first()
        if not req:
            raise HTTPException(status_code=404, detail={"code": "REQUEST_NOT_FOUND", "message": "Request not found"})

        ride = db.query(Ride).filter(Ride.id == req.ride_id).with_for_update().first()
        if str(ride.driver_id) != str(driver_id):
            raise HTTPException(status_code=403, detail={"code": "NOT_AUTHORIZED", "message": "Not authorized"})

        if req.status != RequestStatus.PENDING:
            raise HTTPException(status_code=400, detail="Request is not in pending state")

        if ride.available_seats <= 0:
            raise HTTPException(status_code=409, detail={"code": "RIDE_FULL", "message": "No seats available"})

        req.status = RequestStatus.ACCEPTED
        ride.available_seats -= 1
        if ride.available_seats == 0:
            ride.status = RideStatus.FULL

        _create_notification(
            db, req.passenger_id, NotificationType.REQUEST_ACCEPTED,
            "Request Accepted!",
            f"Your ride request from {ride.source} to {ride.destination} on {ride.departure_date} has been accepted!",
            ride_id=ride.id, request_id=req.id
        )
        db.commit()
        db.refresh(req)
        return req

    @staticmethod
    def reject_request(db: Session, request_id: UUID, driver_id: UUID) -> RideRequest:
        req = db.query(RideRequest).filter(RideRequest.id == request_id).first()
        if not req:
            raise HTTPException(status_code=404, detail="Request not found")

        ride = db.query(Ride).filter(Ride.id == req.ride_id).first()
        if str(ride.driver_id) != str(driver_id):
            raise HTTPException(status_code=403, detail="Not authorized")

        if req.status != RequestStatus.PENDING:
            raise HTTPException(status_code=400, detail="Request is not in pending state")

        req.status = RequestStatus.REJECTED
        _create_notification(
            db, req.passenger_id, NotificationType.REQUEST_REJECTED,
            "Request Rejected",
            f"Unfortunately, your ride request from {ride.source} to {ride.destination} was not accepted.",
            ride_id=ride.id, request_id=req.id
        )
        db.commit()
        db.refresh(req)
        return req

    @staticmethod
    def cancel_request(db: Session, request_id: UUID, passenger_id: UUID) -> RideRequest:
        req = db.query(RideRequest).filter(RideRequest.id == request_id).with_for_update().first()
        if not req:
            raise HTTPException(status_code=404, detail="Request not found")
        if str(req.passenger_id) != str(passenger_id):
            raise HTTPException(status_code=403, detail="Not authorized")
        if req.status == RequestStatus.CANCELLED:
            raise HTTPException(status_code=400, detail="Already cancelled")

        was_accepted = req.status == RequestStatus.ACCEPTED
        req.status = RequestStatus.CANCELLED

        if was_accepted:
            ride = db.query(Ride).filter(Ride.id == req.ride_id).with_for_update().first()
            ride.available_seats += 1
            if ride.status == RideStatus.FULL:
                ride.status = RideStatus.OPEN

        db.commit()
        db.refresh(req)
        return req

    @staticmethod
    def get_ride_requests(db: Session, ride_id: UUID, driver_id: UUID):
        ride = db.query(Ride).filter(Ride.id == ride_id).first()
        if not ride:
            raise HTTPException(status_code=404, detail="Ride not found")
        if str(ride.driver_id) != str(driver_id):
            raise HTTPException(status_code=403, detail="Not authorized")
        return db.query(RideRequest).filter(RideRequest.ride_id == ride_id).all()

    @staticmethod
    def get_my_requests(db: Session, passenger_id: UUID):
        return db.query(RideRequest).filter(
            RideRequest.passenger_id == passenger_id
        ).order_by(RideRequest.created_at.desc()).all()
