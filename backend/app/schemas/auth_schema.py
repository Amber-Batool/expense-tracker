from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class SignupSchema(BaseModel):
    name: str = Field(..., min_length=2, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=6)
    currency: Optional[str] = Field(default=None, max_length=3)


class LoginSchema(BaseModel):
    email: EmailStr
    password: str


class UpdateProfileSchema(BaseModel):
    """Everything here is optional — send only what changed."""

    name: Optional[str] = Field(default=None, min_length=2, max_length=50)
    currency: Optional[str] = Field(default=None, max_length=3)


class ChangePasswordSchema(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=6)


class UserResponse(BaseModel):
    id: str
    name: str
    email: EmailStr
    currency: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse