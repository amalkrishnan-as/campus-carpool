"""Initial migration

Revision ID: 001
Revises: 
Create Date: 2024-01-01 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = '001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create enums
    op.execute("CREATE TYPE userrole AS ENUM ('USER', 'ADMIN')")
    op.execute("CREATE TYPE userstatus AS ENUM ('PENDING_VERIFICATION', 'ACTIVE', 'SUSPENDED', 'DEACTIVATED')")
    op.execute("CREATE TYPE ridestatus AS ENUM ('OPEN', 'FULL', 'STARTED', 'COMPLETED', 'CANCELLED', 'EXPIRED')")
    op.execute("CREATE TYPE requeststatus AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED')")
    op.execute("CREATE TYPE reportreason AS ENUM ('UNSAFE_DRIVING', 'NO_SHOW', 'HARASSMENT', 'FAKE_PROFILE', 'MISCONDUCT', 'SPAM', 'OTHER')")
    op.execute("CREATE TYPE reportstatus AS ENUM ('OPEN', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED')")
    op.execute("CREATE TYPE notificationtype AS ENUM ('RIDE_REQUEST', 'REQUEST_ACCEPTED', 'REQUEST_REJECTED', 'RIDE_CANCELLED', 'RIDE_STARTING', 'RIDE_COMPLETED', 'GENERAL')")

    # Users table
    op.create_table(
        'users',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('email', sa.String(255), nullable=False),
        sa.Column('college_id', sa.String(100), nullable=True),
        sa.Column('department', sa.String(255), nullable=True),
        sa.Column('year', sa.Integer(), nullable=True),
        sa.Column('phone', sa.String(20), nullable=True),
        sa.Column('password_hash', sa.String(255), nullable=False),
        sa.Column('profile_image_url', sa.String(500), nullable=True),
        sa.Column('role', sa.Enum('USER', 'ADMIN', name='userrole'), nullable=False),
        sa.Column('status', sa.Enum('PENDING_VERIFICATION', 'ACTIVE', 'SUSPENDED', 'DEACTIVATED', name='userstatus'), nullable=False),
        sa.Column('average_rating', sa.Float(), nullable=True),
        sa.Column('rating_count', sa.Integer(), nullable=True),
        sa.Column('verification_token', sa.String(255), nullable=True),
        sa.Column('reset_password_token', sa.String(255), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email'),
        sa.UniqueConstraint('college_id'),
    )
    op.create_index('ix_users_email', 'users', ['email'])

    # Vehicles table
    op.create_table(
        'vehicles',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('owner_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('type', sa.String(100), nullable=False),
        sa.Column('model', sa.String(255), nullable=False),
        sa.Column('registration_number', sa.String(50), nullable=False),
        sa.Column('seat_capacity', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['owner_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )

    # Rides table
    op.create_table(
        'rides',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('driver_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('vehicle_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('source', sa.String(500), nullable=False),
        sa.Column('destination', sa.String(500), nullable=False),
        sa.Column('pickup_point', sa.String(500), nullable=False),
        sa.Column('source_latitude', sa.Float(), nullable=True),
        sa.Column('source_longitude', sa.Float(), nullable=True),
        sa.Column('destination_latitude', sa.Float(), nullable=True),
        sa.Column('destination_longitude', sa.Float(), nullable=True),
        sa.Column('departure_date', sa.String(20), nullable=False),
        sa.Column('departure_time', sa.String(10), nullable=False),
        sa.Column('original_seats', sa.Integer(), nullable=False),
        sa.Column('available_seats', sa.Integer(), nullable=False),
        sa.Column('contribution', sa.Numeric(10, 2), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('status', sa.Enum('OPEN', 'FULL', 'STARTED', 'COMPLETED', 'CANCELLED', 'EXPIRED', name='ridestatus'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['driver_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['vehicle_id'], ['vehicles.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_rides_driver_id', 'rides', ['driver_id'])
    op.create_index('ix_rides_departure_date_status', 'rides', ['departure_date', 'status'])
    op.create_index('ix_rides_source_dest_date', 'rides', ['source', 'destination', 'departure_date'])

    # Ride requests table
    op.create_table(
        'ride_requests',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('ride_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('passenger_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('status', sa.Enum('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED', name='requeststatus'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['passenger_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['ride_id'], ['rides.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('ride_id', 'passenger_id', name='uq_ride_passenger'),
    )
    op.create_index('ix_ride_requests_ride_status', 'ride_requests', ['ride_id', 'status'])
    op.create_index('ix_ride_requests_passenger', 'ride_requests', ['passenger_id'])

    # Ratings table
    op.create_table(
        'ratings',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('ride_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('reviewer_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('reviewed_user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('rating', sa.Integer(), nullable=False),
        sa.Column('comment', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['ride_id'], ['rides.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['reviewer_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['reviewed_user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('ride_id', 'reviewer_id', 'reviewed_user_id', name='uq_rating_ride_reviewer_reviewed'),
    )

    # Notifications table
    op.create_table(
        'notifications',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('type', sa.Enum('RIDE_REQUEST', 'REQUEST_ACCEPTED', 'REQUEST_REJECTED', 'RIDE_CANCELLED', 'RIDE_STARTING', 'RIDE_COMPLETED', 'GENERAL', name='notificationtype'), nullable=False),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('ride_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('request_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('is_read', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_notifications_user_read', 'notifications', ['user_id', 'is_read'])

    # Reports table
    op.create_table(
        'reports',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('reporter_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('reported_user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('ride_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('reason', sa.Enum('UNSAFE_DRIVING', 'NO_SHOW', 'HARASSMENT', 'FAKE_PROFILE', 'MISCONDUCT', 'SPAM', 'OTHER', name='reportreason'), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('status', sa.Enum('OPEN', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED', name='reportstatus'), nullable=False),
        sa.Column('admin_notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('resolved_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['reporter_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['reported_user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_reports_status', 'reports', ['status'])

    # Blocks table
    op.create_table(
        'blocks',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('blocker_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('blocked_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['blocker_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['blocked_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('blocker_id', 'blocked_id', name='uq_block_blocker_blocked'),
    )


def downgrade() -> None:
    op.drop_table('blocks')
    op.drop_table('reports')
    op.drop_table('notifications')
    op.drop_table('ratings')
    op.drop_table('ride_requests')
    op.drop_table('rides')
    op.drop_table('vehicles')
    op.drop_table('users')
    op.execute("DROP TYPE IF EXISTS notificationtype")
    op.execute("DROP TYPE IF EXISTS reportstatus")
    op.execute("DROP TYPE IF EXISTS reportreason")
    op.execute("DROP TYPE IF EXISTS requeststatus")
    op.execute("DROP TYPE IF EXISTS ridestatus")
    op.execute("DROP TYPE IF EXISTS userstatus")
    op.execute("DROP TYPE IF EXISTS userrole")
