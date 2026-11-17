
from datetime import date, datetime

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    AliasPath,
    model_validator,
)

from models.task import TaskStatus, TaskPriority


class TaskCreate(BaseModel):
    title: str = Field(min_length=2, max_length=200)
    description: str | None = None

    priority: TaskPriority = TaskPriority.MEDIUM
    due_date: date

    assigned_to_id: int | None = None

    @model_validator(mode="after")
    def validate_assignee(self):
        if self.assigned_to_id is not None and self.assigned_to_id <= 0:
            raise ValueError("Invalid team member ID.")
        return self


class TaskUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=2, max_length=200)
    description: str | None = None

    status: TaskStatus | None = None
    priority: TaskPriority | None = None
    due_date: date | None = None
    assigned_to_id: int | None = None


class TaskStatusUpdate(BaseModel):
    status: TaskStatus


class TaskCommentCreate(BaseModel):
    comment: str = Field(min_length=1, max_length=2000)


class TaskCommentResponse(BaseModel):
    id: int
    task_id: int
    user_id: int
    comment: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TaskActivityResponse(BaseModel):
    id: int
    task_id: int
    user_id: int
    action: str
    details: str | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TaskResponse(BaseModel):
    id: int
    title: str
    description: str | None
    status: TaskStatus
    priority: TaskPriority
    due_date: date

    project_id: int
    assigned_to_id: int | None

    # Read the assigned user's name through the SQLAlchemy relationship.
    assigned_to_name: str | None = Field(
        default=None,
        validation_alias=AliasPath("assigned_to", "name"),
    )

    created_by_id: int

    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
