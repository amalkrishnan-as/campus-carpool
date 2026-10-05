from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.api.v1.deps import get_verified_user
from app.models import User
from app.schemas.misc import ReportCreate, ReportOut, BlockOut
from app.services.misc import ReportService, BlockService

router = APIRouter(tags=["reports-blocks"])

# Reports
reports_router = APIRouter(prefix="/reports")


@reports_router.post("", response_model=ReportOut, status_code=201)
def create_report(data: ReportCreate, db: Session = Depends(get_db), current_user: User = Depends(get_verified_user)):
    return ReportService.create_report(db, current_user.id, data)


@reports_router.get("/me", response_model=List[ReportOut])
def my_reports(db: Session = Depends(get_db), current_user: User = Depends(get_verified_user)):
    return ReportService.get_my_reports(db, current_user.id)


# Blocks
blocks_router = APIRouter(prefix="/blocks")


@blocks_router.post("/{user_id}", response_model=BlockOut, status_code=201)
def block_user(user_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_verified_user)):
    return BlockService.block_user(db, current_user.id, user_id)


@blocks_router.delete("/{user_id}", status_code=204)
def unblock_user(user_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_verified_user)):
    BlockService.unblock_user(db, current_user.id, user_id)


@blocks_router.get("", response_model=List[BlockOut])
def get_blocks(db: Session = Depends(get_db), current_user: User = Depends(get_verified_user)):
    return BlockService.get_blocked_users(db, current_user.id)
