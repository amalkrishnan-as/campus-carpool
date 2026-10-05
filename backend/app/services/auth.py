import secrets
from typing import Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models import User, UserStatus, UserRole
from app.schemas.user import UserCreate, UserUpdate
from app.schemas.auth import LoginRequest
from app.core.security import hash_password, verify_password, create_access_token, create_refresh_token, decode_token, is_college_email
from datetime import timedelta


class AuthService:

    @staticmethod
    def register(db: Session, data: UserCreate) -> User:
        if not is_college_email(data.email):
            raise HTTPException(
                status_code=400,
                detail={"code": "INVALID_COLLEGE_EMAIL", "message": "Only college/university email addresses are allowed."}
            )
        existing = db.query(User).filter(User.email == data.email).first()
        if existing:
            raise HTTPException(
                status_code=409,
                detail={"code": "EMAIL_ALREADY_EXISTS", "message": "Email already registered."}
            )
        verification_token = secrets.token_urlsafe(32)
        user = User(
            name=data.name,
            email=data.email.lower(),
            college_id=data.college_id,
            department=data.department,
            year=data.year,
            phone=data.phone,
            password_hash=hash_password(data.password),
            role=UserRole.USER,
            status=UserStatus.PENDING_VERIFICATION,
            verification_token=verification_token,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        # In production, send verification email here
        # For now, return user with token in response header / log
        print(f"[DEV] Verification token for {user.email}: {verification_token}")
        return user

    @staticmethod
    def login(db: Session, data: LoginRequest):
        user = db.query(User).filter(User.email == data.email.lower()).first()
        if not user or not verify_password(data.password, user.password_hash):
            raise HTTPException(
                status_code=401,
                detail={"code": "INVALID_CREDENTIALS", "message": "Invalid email or password."}
            )
        if user.status == UserStatus.SUSPENDED:
            raise HTTPException(
                status_code=403,
                detail={"code": "ACCOUNT_SUSPENDED", "message": "Your account has been suspended."}
            )
        if user.status == UserStatus.DEACTIVATED:
            raise HTTPException(status_code=403, detail="Account deactivated")
        access_token = create_access_token({"sub": str(user.id)})
        refresh_token = create_refresh_token({"sub": str(user.id)})
        return {"access_token": access_token, "refresh_token": refresh_token, "token_type": "bearer"}

    @staticmethod
    def refresh(db: Session, refresh_token: str):
        payload = decode_token(refresh_token)
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user_id = payload.get("sub")
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        access_token = create_access_token({"sub": str(user.id)})
        new_refresh = create_refresh_token({"sub": str(user.id)})
        return {"access_token": access_token, "refresh_token": new_refresh, "token_type": "bearer"}

    @staticmethod
    def verify_email(db: Session, token: str) -> User:
        user = db.query(User).filter(User.verification_token == token).first()
        if not user:
            raise HTTPException(status_code=400, detail="Invalid or expired verification token")
        user.status = UserStatus.ACTIVE
        user.verification_token = None
        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def forgot_password(db: Session, email: str):
        user = db.query(User).filter(User.email == email.lower()).first()
        if user:
            token = secrets.token_urlsafe(32)
            user.reset_password_token = token
            db.commit()
            print(f"[DEV] Reset token for {email}: {token}")
        # Always return success (don't reveal if email exists)
        return {"message": "If the email is registered, a reset link has been sent."}

    @staticmethod
    def reset_password(db: Session, token: str, new_password: str):
        user = db.query(User).filter(User.reset_password_token == token).first()
        if not user:
            raise HTTPException(status_code=400, detail="Invalid or expired reset token")
        user.password_hash = hash_password(new_password)
        user.reset_password_token = None
        db.commit()
        return {"message": "Password reset successfully"}
