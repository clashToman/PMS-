
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from database import get_db
from models.models import User, UserRole
from schemas.user import (
    UserCreate,
    UserUpdate,
    UserStatusUpdate,
    UserResponse
)
from services import user_service
from routers.auth import get_current_user


router = APIRouter(
    prefix="/api/users",
    tags=["User Management"]
)


def get_admin_user(
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )

    return current_user


@router.post(
    "/",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED
)
def create_team_member(
    user_data: UserCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    new_user = user_service.create_user(db, user_data)

    if new_user is None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email is already registered"
        )

    return new_user


@router.get("/", response_model=list[UserResponse])
def list_team_members(
    search: str | None = None,
    is_active: bool | None = None,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    return user_service.get_users(
        db=db,
        search=search,
        is_active=is_active,
        skip=skip,
        limit=limit
    )


@router.get("/{user_id}", response_model=UserResponse)
def get_team_member(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    user = user_service.get_user_by_id(db, user_id)

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team member not found"
        )

    return user


@router.put("/{user_id}", response_model=UserResponse)
def update_team_member(
    user_id: int,
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    user = user_service.get_user_by_id(db, user_id)

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team member not found"
        )

    updated_user = user_service.update_user(
        db=db,
        user=user,
        user_data=user_data
    )

    if updated_user is None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email is already registered"
        )

    return updated_user


@router.patch("/{user_id}/status", response_model=UserResponse)
def change_team_member_status(
    user_id: int,
    status_data: UserStatusUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    user = user_service.get_user_by_id(db, user_id)

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team member not found"
        )

    return user_service.update_user_status(
        db=db,
        user=user,
        is_active=status_data.is_active
    )
