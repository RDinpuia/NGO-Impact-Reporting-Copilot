"""
Auth API routes: register, login, and get current user.
"""

from fastapi import APIRouter, HTTPException, status, Depends
from datetime import datetime
from bson import ObjectId
from app.auth.models import UserRegister, UserLogin, UserResponse, TokenResponse
from app.auth.service import hash_password, verify_password, create_access_token
from app.auth.dependencies import get_current_user
from app.database import get_db

router = APIRouter()


@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(data: UserRegister):
    """Register a new user and return a JWT token."""
    db = get_db()

    # Check if email already exists
    existing = await db.users.find_one({"email": data.email})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    # Create user document
    user_doc = {
        "name": data.name,
        "email": data.email,
        "password_hash": hash_password(data.password),
        "created_at": datetime.utcnow(),
    }
    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)

    # Generate JWT token
    token = create_access_token({"sub": user_id, "email": data.email})

    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user_id,
            name=data.name,
            email=data.email,
            created_at=user_doc["created_at"],
        ),
    )


@router.post("/login", response_model=TokenResponse)
async def login(data: UserLogin):
    """Authenticate user and return a JWT token."""
    db = get_db()

    user = await db.users.find_one({"email": data.email})
    if not user or not verify_password(data.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    user_id = str(user["_id"])
    token = create_access_token({"sub": user_id, "email": user["email"]})

    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user_id,
            name=user["name"],
            email=user["email"],
            created_at=user["created_at"],
        ),
    )


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    """Get the current authenticated user's profile."""
    return UserResponse(
        id=current_user["id"],
        name=current_user["name"],
        email=current_user["email"],
        created_at=current_user["created_at"],
    )
