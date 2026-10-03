from fastapi import APIRouter, Depends, status

from app.schemas.auth_schema import (
    ChangePasswordSchema,
    LoginSchema,
    SignupSchema,
    TokenResponse,
    UpdateProfileSchema,
)
from app.services import auth_service
from app.utils.jwt_handler import get_current_user

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def signup(payload: SignupSchema):
    return await auth_service.signup_user(payload)


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginSchema):
    return await auth_service.login_user(payload)


@router.get("/me")
async def me(current_user: dict = Depends(get_current_user)):
    """Source of truth for the logged-in user, including their base currency."""
    return await auth_service.get_profile(current_user["user_id"])


@router.put("/me")
async def update_me(
    payload: UpdateProfileSchema, current_user: dict = Depends(get_current_user)
):
    """
    Update name and/or base currency. Changing the currency re-converts every
    stored transaction so historical totals stay accurate.
    """
    return await auth_service.update_profile(current_user["user_id"], payload)


@router.put("/password")
async def change_password(
    payload: ChangePasswordSchema, current_user: dict = Depends(get_current_user)
):
    return await auth_service.change_password(current_user["user_id"], payload)