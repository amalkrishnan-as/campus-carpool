from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException
from app.models import (
    Report, Block, Notification, ReportStatus, User, UserStatus, Ride, RideRequest, RequestStatus
)
from app.schemas.misc import ReportCreate, ReportUpdate, AdminAnalytics
from datetime import datetime, timezone


class ReportService:

    @staticmethod
    def create_report(db: Session, reporter_id: UUID, data: ReportCreate) -> Report:
        if str(reporter_id) == str(data.reported_user_id):
            raise HTTPException(status_code=400, detail="Cannot report yourself")
        report = Report(
            reporter_id=reporter_id,
            reported_user_id=data.reported_user_id,
            ride_id=data.ride_id,
            reason=data.reason,
            description=data.description,
            status=ReportStatus.OPEN,
        )
        db.add(report)
        db.commit()
        db.refresh(report)
        return report

    @staticmethod
    def get_my_reports(db: Session, reporter_id: UUID):
        return db.query(Report).filter(Report.reporter_id == reporter_id).order_by(Report.created_at.desc()).all()

    @staticmethod
    def get_all_reports(db: Session, status=None):
        q = db.query(Report)
        if status:
            q = q.filter(Report.status == status)
        return q.order_by(Report.created_at.desc()).all()

    @staticmethod
    def update_report(db: Session, report_id: UUID, data: ReportUpdate) -> Report:
        report = db.query(Report).filter(Report.id == report_id).first()
        if not report:
            raise HTTPException(status_code=404, detail="Report not found")
        if data.status:
            report.status = data.status
            if data.status in [ReportStatus.RESOLVED, ReportStatus.DISMISSED]:
                report.resolved_at = datetime.now(timezone.utc)
        if data.admin_notes is not None:
            report.admin_notes = data.admin_notes
        db.commit()
        db.refresh(report)
        return report


class BlockService:

    @staticmethod
    def block_user(db: Session, blocker_id: UUID, blocked_id: UUID) -> Block:
        if str(blocker_id) == str(blocked_id):
            raise HTTPException(status_code=400, detail="Cannot block yourself")
        existing = db.query(Block).filter(
            Block.blocker_id == blocker_id, Block.blocked_id == blocked_id
        ).first()
        if existing:
            raise HTTPException(status_code=409, detail="User already blocked")
        block = Block(blocker_id=blocker_id, blocked_id=blocked_id)
        db.add(block)
        db.commit()
        db.refresh(block)
        return block

    @staticmethod
    def unblock_user(db: Session, blocker_id: UUID, blocked_id: UUID):
        block = db.query(Block).filter(
            Block.blocker_id == blocker_id, Block.blocked_id == blocked_id
        ).first()
        if not block:
            raise HTTPException(status_code=404, detail="Block not found")
        db.delete(block)
        db.commit()

    @staticmethod
    def get_blocked_users(db: Session, blocker_id: UUID):
        return db.query(Block).filter(Block.blocker_id == blocker_id).all()


class NotificationService:

    @staticmethod
    def get_notifications(db: Session, user_id: UUID, unread_only: bool = False):
        q = db.query(Notification).filter(Notification.user_id == user_id)
        if unread_only:
            q = q.filter(Notification.is_read == False)
        return q.order_by(Notification.created_at.desc()).limit(50).all()

    @staticmethod
    def mark_read(db: Session, notification_id: UUID, user_id: UUID):
        notif = db.query(Notification).filter(
            Notification.id == notification_id, Notification.user_id == user_id
        ).first()
        if not notif:
            raise HTTPException(status_code=404, detail="Notification not found")
        notif.is_read = True
        db.commit()

    @staticmethod
    def mark_all_read(db: Session, user_id: UUID):
        db.query(Notification).filter(
            Notification.user_id == user_id, Notification.is_read == False
        ).update({"is_read": True})
        db.commit()

    @staticmethod
    def get_unread_count(db: Session, user_id: UUID) -> int:
        return db.query(func.count(Notification.id)).filter(
            Notification.user_id == user_id, Notification.is_read == False
        ).scalar() or 0


class AdminService:

    @staticmethod
    def get_users(db: Session, page: int = 1, page_size: int = 20, status=None):
        q = db.query(User)
        if status:
            q = q.filter(User.status == status)
        total = q.count()
        import math
        return {
            "items": q.offset((page - 1) * page_size).limit(page_size).all(),
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": math.ceil(total / page_size) if total else 0
        }

    @staticmethod
    def suspend_user(db: Session, user_id: UUID) -> User:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail={"code": "USER_NOT_FOUND", "message": "User not found"})
        user.status = UserStatus.SUSPENDED
        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def activate_user(db: Session, user_id: UUID) -> User:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail={"code": "USER_NOT_FOUND", "message": "User not found"})
        user.status = UserStatus.ACTIVE
        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def get_analytics(db: Session) -> AdminAnalytics:
        from app.models import RideStatus, RequestStatus
        return AdminAnalytics(
            total_users=db.query(func.count(User.id)).scalar() or 0,
            active_users=db.query(func.count(User.id)).filter(User.status == UserStatus.ACTIVE).scalar() or 0,
            total_rides=db.query(func.count(Ride.id)).scalar() or 0,
            active_rides=db.query(func.count(Ride.id)).filter(Ride.status.in_([RideStatus.OPEN, RideStatus.FULL])).scalar() or 0,
            completed_rides=db.query(func.count(Ride.id)).filter(Ride.status == RideStatus.COMPLETED).scalar() or 0,
            total_requests=db.query(func.count(RideRequest.id)).scalar() or 0,
            accepted_requests=db.query(func.count(RideRequest.id)).filter(RideRequest.status == RequestStatus.ACCEPTED).scalar() or 0,
            open_reports=db.query(func.count(Report.id)).filter(Report.status == ReportStatus.OPEN).scalar() or 0,
        )
