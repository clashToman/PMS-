from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    status,
)
from sqlalchemy.orm import Session

from database import get_db
from routers.auth import get_current_user

from models.models import User, UserRole
from models.task import TaskStatus, TaskPriority

from schemas.task import (
    TaskCreate,
    TaskUpdate,
    TaskStatusUpdate,
    TaskCommentCreate,
    TaskResponse,
    TaskCommentResponse,
    TaskActivityResponse,
)

from services import task_service


router = APIRouter(
    prefix="/api",
    tags=["Task Management"],
)


def get_admin_user(
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=403,
            detail="Only Admin can perform this action.",
        )

    return current_user


# CREATE TASK
@router.post(
    "/projects/{project_id}/tasks",
    response_model=TaskResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_task(
    project_id: int,
    task_data: TaskCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user),
):
    try:
        return task_service.create_task(
            db,
            project_id,
            task_data,
            admin,
        )
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error))


# GET PROJECT TASKS
@router.get(
    "/projects/{project_id}/tasks",
    response_model=list[TaskResponse],
)
def get_tasks(
    project_id: int,
    search: str | None = None,
    task_status: TaskStatus | None = Query(default=None, alias="status"),
    priority: TaskPriority | None = None,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return task_service.get_tasks(
            db,
            project_id,
            current_user,
            search,
            task_status,
            priority,
            skip,
            limit,
        )
    except ValueError as error:
        raise HTTPException(status_code=404, detail=str(error))
    except PermissionError as error:
        raise HTTPException(status_code=403, detail=str(error))


# GET TASK BY ID
@router.get("/tasks/{task_id}", response_model=TaskResponse)
def get_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = task_service.get_task_by_id(db, task_id, current_user)

    if task is None:
        raise HTTPException(status_code=404, detail="Task not found.")

    return task


# UPDATE TASK - ADMIN ONLY
@router.put("/tasks/{task_id}", response_model=TaskResponse)
def update_task(
    task_id: int,
    task_data: TaskUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user),
):
    task = task_service.get_task_by_id(db, task_id, admin)

    if task is None:
        raise HTTPException(status_code=404, detail="Task not found.")

    try:
        return task_service.update_task(
            db,
            task,
            task_data,
            admin,
        )
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error))


# UPDATE TASK STATUS
@router.patch("/tasks/{task_id}/status", response_model=TaskResponse)
def update_task_status(
    task_id: int,
    status_data: TaskStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = task_service.get_task_by_id(db, task_id, current_user)

    if task is None:
        raise HTTPException(status_code=404, detail="Task not found.")

    # Team members may update only their own assigned tasks.
    return task_service.update_task_status(
        db,
        task,
        status_data.status,
        current_user,
    )


# DELETE TASK - ADMIN ONLY
@router.delete("/tasks/{task_id}", status_code=204)
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user),
):
    task = task_service.get_task_by_id(db, task_id, admin)

    if task is None:
        raise HTTPException(status_code=404, detail="Task not found.")

    task_service.delete_task(db, task)

    return None


# ADD COMMENT
@router.post(
    "/tasks/{task_id}/comments",
    response_model=TaskCommentResponse,
    status_code=201,
)
def add_comment(
    task_id: int,
    comment_data: TaskCommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = task_service.get_task_by_id(db, task_id, current_user)

    if task is None:
        raise HTTPException(status_code=404, detail="Task not found.")

    return task_service.add_comment(
        db,
        task,
        current_user,
        comment_data.comment,
    )


# GET COMMENTS
@router.get(
    "/tasks/{task_id}/comments",
    response_model=list[TaskCommentResponse],
)
def get_comments(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = task_service.get_task_by_id(db, task_id, current_user)

    if task is None:
        raise HTTPException(status_code=404, detail="Task not found.")

    return task_service.get_task_comments(db, task_id)


# GET ACTIVITY HISTORY
@router.get(
    "/tasks/{task_id}/activities",
    response_model=list[TaskActivityResponse],
)
def get_activities(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = task_service.get_task_by_id(db, task_id, current_user)

    if task is None:
        raise HTTPException(status_code=404, detail="Task not found.")

    return task_service.get_task_activities(db, task_id)