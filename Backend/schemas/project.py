from datetime import date, datetime
from pydantic import BaseModel, ConfigDict, Field, model_validator

from models.project import ProjectStatus


class ProjectCreate(BaseModel):
    name: str = Field(min_length=2, max_length=150)
    description: str | None = None
    start_date: date
    deadline: date
    status: ProjectStatus = ProjectStatus.PLANNING
    member_ids: list[int] = Field(default_factory=list)

    @model_validator(mode="after")
    def validate_dates(self):
        if self.deadline < self.start_date:
            raise ValueError("Deadline cannot be before start date.")
        return self


class ProjectUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=150)
    description: str | None = None
    start_date: date | None = None
    deadline: date | None = None
    status: ProjectStatus | None = None
    member_ids: list[int] | None = None


class ProjectMemberResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    is_active: bool

    model_config = ConfigDict(from_attributes=True)


class ProjectResponse(BaseModel):
    id: int
    name: str
    description: str | None
    start_date: date
    deadline: date
    status: ProjectStatus
    created_by_id: int
    created_at: datetime
    updated_at: datetime
    members: list[ProjectMemberResponse] = []

    model_config = ConfigDict(from_attributes=True)