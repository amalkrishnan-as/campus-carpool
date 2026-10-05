from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.api.v1.deps import get_verified_user
from app.models import User, Vehicle
from app.schemas.vehicle import VehicleCreate, VehicleUpdate, VehicleOut
from fastapi import HTTPException

router = APIRouter(prefix="/vehicles", tags=["vehicles"])


@router.get("", response_model=List[VehicleOut])
def list_vehicles(db: Session = Depends(get_db), current_user: User = Depends(get_verified_user)):
    return db.query(Vehicle).filter(Vehicle.owner_id == current_user.id).all()


@router.post("", response_model=VehicleOut, status_code=201)
def create_vehicle(data: VehicleCreate, db: Session = Depends(get_db), current_user: User = Depends(get_verified_user)):
    vehicle = Vehicle(owner_id=current_user.id, **data.model_dump())
    db.add(vehicle)
    db.commit()
    db.refresh(vehicle)
    return vehicle


@router.get("/{vehicle_id}", response_model=VehicleOut)
def get_vehicle(vehicle_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_verified_user)):
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id, Vehicle.owner_id == current_user.id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return vehicle


@router.patch("/{vehicle_id}", response_model=VehicleOut)
def update_vehicle(vehicle_id: str, data: VehicleUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_verified_user)):
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id, Vehicle.owner_id == current_user.id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(vehicle, field, value)
    db.commit()
    db.refresh(vehicle)
    return vehicle


@router.delete("/{vehicle_id}", status_code=204)
def delete_vehicle(vehicle_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_verified_user)):
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id, Vehicle.owner_id == current_user.id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    db.delete(vehicle)
    db.commit()
