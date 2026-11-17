from pydantic import BaseModel


class ProjectStatistics(BaseModel):
    total: int
    active: int
    completed: int
    on_hold: int
    planning: int
    cancelled: int


class TaskStatistics(BaseModel):
    total: int
    todo: int
    in_progress: int
    completed: int
    overdue: int


class DashboardSummary(BaseModel):
    role: str
    projects: ProjectStatistics
    tasks: TaskStatistics
    upcoming_tasks: list[dict]
    recent_activities: list[dict]
    team_workload: list[dict] | None = None