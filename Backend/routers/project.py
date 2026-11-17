from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from database import get_db
from routers.auth import get_current_user

from models.models import User, UserRole
from models.project import ProjectStatus

from schemas.project import (
    ProjectCreate,
    ProjectUpdate,
    ProjectResponse,
)

from services import project_service


router = APIRouter(
    prefix="/api/projects",
    tags=["Project Management"],
)


def get_admin_user(
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Admin can perform this action.",
        )

    return current_user


# CREATE PROJECT
@router.post(
    "/",
    response_model=ProjectResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_project(
    project_data: ProjectCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user),
):
    try:
        return project_service.create_project(
            db=db,
            project_data=project_data,
            admin=admin,
        )
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        )


# GET ALL PROJECTS
@router.get(
    "/",
    response_model=list[ProjectResponse],
)
def get_projects(
    search: str | None = None,
    project_status: ProjectStatus | None = Query(
        default=None,
        alias="status",
    ),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return project_service.get_projects(
        db=db,
        current_user=current_user,
        search=search,
        status=project_status,
        skip=skip,
        limit=limit,
    )


# GET PROJECT BY ID
@router.get(
    "/{project_id}",
    response_model=ProjectResponse,
)
def get_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = project_service.get_project_by_id(
        db=db,
        project_id=project_id,
        current_user=current_user,
    )

    if project is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found.",
        )

    return project


# UPDATE PROJECT
@router.put(
    "/{project_id}",
    response_model=ProjectResponse,
)
def update_project(
    project_id: int,
    project_data: ProjectUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user),
):
    project = project_service.get_project_by_id(
        db=db,
        project_id=project_id,
        current_user=admin,
    )

    if project is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found.",
        )

    try:
        return project_service.update_project(
            db=db,
            project=project,
            project_data=project_data,
        )
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        )


# DELETE PROJECT
@router.delete(
    "/{project_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user),
):
    project = project_service.get_project_by_id(
        db=db,
        project_id=project_id,
        current_user=admin,
    )

    if project is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found.",
        )

    project_service.delete_project(db=db, project=project)

    return None