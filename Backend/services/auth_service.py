
from sqlalchemy.orm import Session

from models.models import User

from utils.security import (
    verify_password,
    create_access_token
)


def authenticate_user(
    db: Session,
    email: str,
    password: str
):

    user = db.query(User).filter(
        User.email == email
    ).first()

    if not user:
        return None

    if not user.is_active:
        return None

    if not verify_password(
        password,
        user.hashed_password
    ):
        return None

    return user


def generate_user_token(user: User):

    return create_access_token({
        "sub": str(user.id),
        "role": user.role.value
    })
