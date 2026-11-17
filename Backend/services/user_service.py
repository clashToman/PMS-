
from sqlalchemy import select, or_
from sqlalchemy.orm import Session

from models.models import User, UserRole
from schemas.user import UserCreate, UserUpdate
from utils.security import hash_password


def create_user(db: Session, user_data: UserCreate):
    existing_user = db.scalar(
        select(User).where(User.email == str(user_data.email))
    )

    if existing_user:
        return None

    new_user = User(
        name=user_data.name,
        email=str(user_data.email),
        hashed_password=hash_password(user_data.password),
        role=UserRole.TEAM_MEMBER,
        is_active=True
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


def get_users(
    db: Session,
    search: str | None = None,
    is_active: bool | None = None,
    skip: int = 0,
    limit: int = 20
):
    query = select(User).where(
        User.role == UserRole.TEAM_MEMBER
    )

    if search:
        search_term = f"%{search.strip()}%"
        query = query.where(
            or_(
                User.name.ilike(search_term),
                User.email.ilike(search_term)
            )
        )

    if is_active is not None:
        query = query.where(User.is_active == is_active)

    query = query.order_by(User.id.desc()).offset(skip).limit(limit)

    return list(db.scalars(query).all())


def get_user_by_id(db: Session, user_id: int):
    user = db.scalar(
        select(User).where(
            User.id == user_id,
            User.role == UserRole.TEAM_MEMBER
        )
    )

    return user


def update_user(
    db: Session,
    user: User,
    user_data: UserUpdate
):
    update_data = user_data.model_dump(exclude_unset=True)

    new_email = update_data.get("email")

    if new_email is not None:
        new_email = str(new_email)

        existing_user = db.scalar(
            select(User).where(
                User.email == new_email,
                User.id != user.id
            )
        )

        if existing_user:
            return None

        update_data["email"] = new_email

    new_password = update_data.pop("password", None)

    if new_password:
        user.hashed_password = hash_password(new_password)

    for field, value in update_data.items():
        if value is not None:
            setattr(user, field, value)

    db.commit()
    db.refresh(user)

    return user


def update_user_status(
    db: Session,
    user: User,
    is_active: bool
):
    user.is_active = is_active

    db.commit()
    db.refresh(user)

    return user
