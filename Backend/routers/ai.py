
import logging

from fastapi import APIRouter, Depends, HTTPException
from pydantic import ValidationError
from sqlalchemy.orm import Session

from database import get_db
from routers.auth import get_current_user
from models.models import User
from schemas.ai import AIAnalyzeRequest
from services.ai_service import analyze_project

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/ai",
    tags=["AI Project Assistant"]
)


@router.post("/projects/{project_id}/analyze")
def analyze_project_endpoint(
    project_id: int,
    request: AIAnalyzeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        result = analyze_project(
            db=db,
            project_id=project_id,
            current_user=current_user,
            question=request.question
        )

        return {
            "success": True,
            "message": "Project analysis generated successfully.",
            "data": result
        }

    except PermissionError as error:
        raise HTTPException(status_code=403, detail=str(error))

    except ValueError as error:
        raise HTTPException(status_code=404, detail=str(error))

    except ValidationError:
        logger.exception("Gemini returned an invalid response.")
        raise HTTPException(
            status_code=502,
            detail="Gemini returned an invalid response."
        )

    except RuntimeError as error:
        logger.exception("AI service configuration error.")
        raise HTTPException(status_code=503, detail=str(error))

    except Exception:
        logger.exception("AI project analysis failed.")
        raise HTTPException(
            status_code=502,
            detail="AI service failed. Check the backend terminal for details."
        )
