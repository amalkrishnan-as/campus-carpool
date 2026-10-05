from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.api.v1.deps import get_admin_user
from app.models import User, Ride
from app.schemas.user import UserOut
from app.schemas.ride import RideOut
from app.schemas.misc import ReportOut, ReportUpdate, AdminAnalytics
from app.services.misc import AdminService, ReportService
from app.services.ride import RideService

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/users", response_model=dict)
def list_users(
    page: int = 1,
    page_size: int = 20,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    return AdminService.get_users(db, page, page_size, status)


@router.patch("/users/{user_id}/suspend", response_model=UserOut)
def suspend_user(user_id: str, db: Session = Depends(get_db), admin: User = Depends(get_admin_user)):
    return AdminService.suspend_user(db, user_id)


@router.patch("/users/{user_id}/activate", response_model=UserOut)
def activate_user(user_id: str, db: Session = Depends(get_db), admin: User = Depends(get_admin_user)):
    return AdminService.activate_user(db, user_id)


@router.get("/rides")
def list_rides(page: int = 1, page_size: int = 20, db: Session = Depends(get_db), admin: User = Depends(get_admin_user)):
    from app.schemas.ride import RideSearchParams
    params = RideSearchParams(page=page, page_size=page_size)
    q = db.query(Ride)
    total = q.count()
    import math
    rides = q.order_by(Ride.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return {
        "items": [{"id": str(r.id), "source": r.source, "destination": r.destination,
                   "status": r.status, "departure_date": r.departure_date,
                   "driver_id": str(r.driver_id)} for r in rides],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": math.ceil(total / page_size) if total else 0
    }


@router.post("/rides/{ride_id}/cancel")
def admin_cancel_ride(ride_id: str, db: Session = Depends(get_db), admin: User = Depends(get_admin_user)):
    ride = db.query(Ride).filter(Ride.id == ride_id).first()
    if not ride:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Ride not found")
    ride.status = "CANCELLED"
    db.commit()
    return {"message": "Ride cancelled"}


@router.get("/reports", response_model=List[ReportOut])
def list_reports(status: Optional[str] = None, db: Session = Depends(get_db), admin: User = Depends(get_admin_user)):
    return ReportService.get_all_reports(db, status)


@router.patch("/reports/{report_id}", response_model=ReportOut)
def update_report(report_id: str, data: ReportUpdate, db: Session = Depends(get_db), admin: User = Depends(get_admin_user)):
    return ReportService.update_report(db, report_id, data)


@router.get("/analytics", response_model=AdminAnalytics)
def get_analytics(db: Session = Depends(get_db), admin: User = Depends(get_admin_user)):
    return AdminService.get_analytics(db)
