from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.auth import LoginRequest, RefreshRequest, VerifyRequest, ForgotPasswordRequest, ResetPasswordRequest, TokenResponse
from app.schemas.user import UserCreate, UserOut
from app.services.auth import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserOut, status_code=201)
def register(data: UserCreate, db: Session = Depends(get_db)):
    user = AuthService.register(db, data)
    return user


@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    return AuthService.login(db, data)


@router.post("/refresh", response_model=TokenResponse)
def refresh(data: RefreshRequest, db: Session = Depends(get_db)):
    return AuthService.refresh(db, data.refresh_token)


@router.post("/verify")
def verify(data: VerifyRequest, db: Session = Depends(get_db)):
    AuthService.verify_email(db, data.token)
    return {"message": "Email verified successfully. You can now log in."}


@router.post("/forgot-password")
def forgot_password(data: ForgotPasswordRequest, db: Session = Depends(get_db)):
    return AuthService.forgot_password(db, data.email)


@router.post("/reset-password")
def reset_password(data: ResetPasswordRequest, db: Session = Depends(get_db)):
    return AuthService.reset_password(db, data.token, data.new_password)


@router.post("/logout")
def logout():
    # JWT is stateless; client should discard tokens
    return {"message": "Logged out successfully"}
