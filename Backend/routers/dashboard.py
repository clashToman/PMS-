from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from routers.auth import get_current_user

from models.models import User
from schemas.dashboard import DashboardSummary

from services.dashboard_service import get_dashboard_summary


router = APIRouter(
    prefix="/api/dashboard",
    tags=["Dashboard & Reports"],
)


@router.get(
    "/summary",
    response_model=DashboardSummary,
)
def dashboard_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_dashboard_summary(
        db=db,
        current_user=current_user,
    )