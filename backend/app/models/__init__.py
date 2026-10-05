import uuid
import enum
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, DateTime, Enum, Boolean, Integer, Float,
    ForeignKey, Text, UniqueConstraint, Index, Numeric
)
from sqlalchemy.types import TypeDecorator, CHAR
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import relationship
from app.core.database import Base


class GUID(TypeDecorator):
    impl = CHAR(36)
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql":
            return dialect.type_descriptor(PG_UUID(as_uuid=True))
        return dialect.type_descriptor(CHAR(36))

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        if dialect.name == "postgresql":
            return uuid.UUID(str(value)) if not isinstance(value, uuid.UUID) else value
        return str(value)

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        if not isinstance(value, uuid.UUID):
            return uuid.UUID(str(value))
        return value


def UUID(*args, **kwargs):
    return GUID()


def utcnow():
    return datetime.now(timezone.utc)


class UserRole(str, enum.Enum):
    USER = "USER"
    ADMIN = "ADMIN"


class UserStatus(str, enum.Enum):
    PENDING_VERIFICATION = "PENDING_VERIFICATION"
    ACTIVE = "ACTIVE"
    SUSPENDED = "SUSPENDED"
    DEACTIVATED = "DEACTIVATED"


class RideStatus(str, enum.Enum):
    OPEN = "OPEN"
    FULL = "FULL"
    STARTED = "STARTED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"
    EXPIRED = "EXPIRED"


class RequestStatus(str, enum.Enum):
    PENDING = "PENDING"
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"
    CANCELLED = "CANCELLED"


class ReportReason(str, enum.Enum):
    UNSAFE_DRIVING = "UNSAFE_DRIVING"
    NO_SHOW = "NO_SHOW"
    HARASSMENT = "HARASSMENT"
    FAKE_PROFILE = "FAKE_PROFILE"
    MISCONDUCT = "MISCONDUCT"
    SPAM = "SPAM"
    OTHER = "OTHER"


class ReportStatus(str, enum.Enum):
    OPEN = "OPEN"
    UNDER_REVIEW = "UNDER_REVIEW"
    RESOLVED = "RESOLVED"
    DISMISSED = "DISMISSED"


class NotificationType(str, enum.Enum):
    RIDE_REQUEST = "RIDE_REQUEST"
    REQUEST_ACCEPTED = "REQUEST_ACCEPTED"
    REQUEST_REJECTED = "REQUEST_REJECTED"
    RIDE_CANCELLED = "RIDE_CANCELLED"
    RIDE_STARTING = "RIDE_STARTING"
    RIDE_COMPLETED = "RIDE_COMPLETED"
    GENERAL = "GENERAL"


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    college_id = Column(String(100), unique=True, nullable=True)
    department = Column(String(255), nullable=True)
    year = Column(Integer, nullable=True)
    phone = Column(String(20), nullable=True)
    password_hash = Column(String(255), nullable=False)
    profile_image_url = Column(String(500), nullable=True)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.USER)
    status = Column(Enum(UserStatus), nullable=False, default=UserStatus.PENDING_VERIFICATION)
    average_rating = Column(Float, default=0.0)
    rating_count = Column(Integer, default=0)
    verification_token = Column(String(255), nullable=True)
    reset_password_token = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    vehicles = relationship("Vehicle", back_populates="owner", cascade="all, delete-orphan")
    rides_as_driver = relationship("Ride", back_populates="driver", cascade="all, delete-orphan")
    ride_requests = relationship("RideRequest", back_populates="passenger", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    ratings_given = relationship("Rating", foreign_keys="Rating.reviewer_id", back_populates="reviewer")
    ratings_received = relationship("Rating", foreign_keys="Rating.reviewed_user_id", back_populates="reviewed_user")
    reports_filed = relationship("Report", foreign_keys="Report.reporter_id", back_populates="reporter")
    reports_received = relationship("Report", foreign_keys="Report.reported_user_id", back_populates="reported_user")
    blocks_made = relationship("Block", foreign_keys="Block.blocker_id", back_populates="blocker")
    blocks_received = relationship("Block", foreign_keys="Block.blocked_id", back_populates="blocked")


class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    type = Column(String(100), nullable=False)
    model = Column(String(255), nullable=False)
    registration_number = Column(String(50), nullable=False)
    seat_capacity = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    owner = relationship("User", back_populates="vehicles")
    rides = relationship("Ride", back_populates="vehicle")


class Ride(Base):
    __tablename__ = "rides"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    driver_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    vehicle_id = Column(UUID(as_uuid=True), ForeignKey("vehicles.id", ondelete="SET NULL"), nullable=True)
    source = Column(String(500), nullable=False)
    destination = Column(String(500), nullable=False)
    pickup_point = Column(String(500), nullable=False)
    source_latitude = Column(Float, nullable=True)
    source_longitude = Column(Float, nullable=True)
    destination_latitude = Column(Float, nullable=True)
    destination_longitude = Column(Float, nullable=True)
    departure_date = Column(String(20), nullable=False)  # YYYY-MM-DD
    departure_time = Column(String(10), nullable=False)  # HH:MM
    original_seats = Column(Integer, nullable=False)
    available_seats = Column(Integer, nullable=False)
    contribution = Column(Numeric(10, 2), nullable=False, default=0)
    notes = Column(Text, nullable=True)
    status = Column(Enum(RideStatus), nullable=False, default=RideStatus.OPEN)
    created_at = Column(DateTime(timezone=True), default=utcnow)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    driver = relationship("User", back_populates="rides_as_driver")
    vehicle = relationship("Vehicle", back_populates="rides")
    requests = relationship("RideRequest", back_populates="ride", cascade="all, delete-orphan")
    ratings = relationship("Rating", back_populates="ride", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_rides_driver_id", "driver_id"),
        Index("ix_rides_departure_date_status", "departure_date", "status"),
        Index("ix_rides_source_dest_date", "source", "destination", "departure_date"),
    )


class RideRequest(Base):
    __tablename__ = "ride_requests"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ride_id = Column(UUID(as_uuid=True), ForeignKey("rides.id", ondelete="CASCADE"), nullable=False)
    passenger_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    status = Column(Enum(RequestStatus), nullable=False, default=RequestStatus.PENDING)
    created_at = Column(DateTime(timezone=True), default=utcnow)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    ride = relationship("Ride", back_populates="requests")
    passenger = relationship("User", back_populates="ride_requests")

    __table_args__ = (
        UniqueConstraint("ride_id", "passenger_id", name="uq_ride_passenger"),
        Index("ix_ride_requests_ride_status", "ride_id", "status"),
        Index("ix_ride_requests_passenger", "passenger_id"),
    )


class Rating(Base):
    __tablename__ = "ratings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ride_id = Column(UUID(as_uuid=True), ForeignKey("rides.id", ondelete="CASCADE"), nullable=False)
    reviewer_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    reviewed_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    rating = Column(Integer, nullable=False)
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    ride = relationship("Ride", back_populates="ratings")
    reviewer = relationship("User", foreign_keys=[reviewer_id], back_populates="ratings_given")
    reviewed_user = relationship("User", foreign_keys=[reviewed_user_id], back_populates="ratings_received")

    __table_args__ = (
        UniqueConstraint("ride_id", "reviewer_id", "reviewed_user_id", name="uq_rating_ride_reviewer_reviewed"),
    )


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    type = Column(Enum(NotificationType), nullable=False, default=NotificationType.GENERAL)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    ride_id = Column(UUID(as_uuid=True), nullable=True)
    request_id = Column(UUID(as_uuid=True), nullable=True)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    user = relationship("User", back_populates="notifications")

    __table_args__ = (
        Index("ix_notifications_user_read", "user_id", "is_read"),
    )


class Report(Base):
    __tablename__ = "reports"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    reporter_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    reported_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    ride_id = Column(UUID(as_uuid=True), nullable=True)
    reason = Column(Enum(ReportReason), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(Enum(ReportStatus), nullable=False, default=ReportStatus.OPEN)
    admin_notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)
    resolved_at = Column(DateTime(timezone=True), nullable=True)

    reporter = relationship("User", foreign_keys=[reporter_id], back_populates="reports_filed")
    reported_user = relationship("User", foreign_keys=[reported_user_id], back_populates="reports_received")

    __table_args__ = (
        Index("ix_reports_status", "status"),
    )


class Block(Base):
    __tablename__ = "blocks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    blocker_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    blocked_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    blocker = relationship("User", foreign_keys=[blocker_id], back_populates="blocks_made")
    blocked = relationship("User", foreign_keys=[blocked_id], back_populates="blocks_received")

    __table_args__ = (
        UniqueConstraint("blocker_id", "blocked_id", name="uq_block_blocker_blocked"),
    )
