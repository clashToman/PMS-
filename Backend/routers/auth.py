
import jwt

from jwt.exceptions import InvalidTokenError

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status
)

from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from sqlalchemy.orm import Session

from database import get_db

from config import settings

from models.models import User, UserRole

from schemas.auth import (
    LoginRequest,
    TokenResponse,
    UserResponse
)

from services.auth_service import (
    authenticate_user,
    generate_user_token
)


router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"]
)

bearer_scheme = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db)
):

    token = credentials.credentials

    try:

        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )

        user_id = payload.get("sub")

        if user_id is None:
            raise HTTPException(
                status_code=401,
                detail="Invalid token"
            )

    except InvalidTokenError:

        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token"
        )

    user = db.query(User).filter(
        User.id == int(user_id)
    ).first()

    if not user or not user.is_active:

        raise HTTPException(
            status_code=401,
            detail="User account is unavailable"
        )

    return user


def require_admin(
    current_user: User = Depends(get_current_user)
):

    if current_user.role != UserRole.ADMIN:

        raise HTTPException(
            status_code=403,
            detail="Admin access required"
        )

    return current_user


@router.post(
    "/login",
    response_model=TokenResponse
)
def login(
    request: LoginRequest,
    db: Session = Depends(get_db)
):

    user = authenticate_user(
        db,
        request.email,
        request.password
    )

    if not user:

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    token = generate_user_token(user)

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user
    }


@router.get(
    "/me",
    response_model=UserResponse
)
def get_profile(
    current_user: User = Depends(get_current_user)
):

    return current_user


@router.get("/admin-check")
def admin_check(
    current_user: User = Depends(require_admin)
):

    return {
        "message": "Admin authorization successful"
    }


@router.post("/logout")
def logout(
    current_user: User = Depends(get_current_user)
):

    # JWT is stateless. The client must discard its token.
    # Server-side token revocation will be added if required.

    return {
        "message": "Logout successful"
    }
