"""
Pydantic models for authentication requests and responses.
"""

from pydantic import BaseModel, EmailStr, Field
from datetime import datetime


class UserRegister(BaseModel):
    """Registration request body."""
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6)


class UserLogin(BaseModel):
    """Login request body."""
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    """User data returned in API responses."""
    id: str
    name: str
    email: str
    created_at: datetime


class TokenResponse(BaseModel):
    """JWT token response after login/register."""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
