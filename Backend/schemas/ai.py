from pydantic import BaseModel, Field


class DelayRisk(BaseModel):
    task_id: int
    task_title: str
    reason: str
    severity: str


class PriorityRecommendation(BaseModel):
    task_id: int
    task_title: str
    current_priority: str
    suggested_priority: str
    reason: str


class AIProjectAnalysis(BaseModel):
    project_name: str
    summary: str
    progress_assessment: str

    delay_risks: list[DelayRisk] = Field(default_factory=list)

    priority_recommendations: list[
        PriorityRecommendation
    ] = Field(default_factory=list)

    next_steps: list[str] = Field(default_factory=list)

    answer: str


class AIAnalyzeRequest(BaseModel):
    question: str | None = Field(
        default=None,
        max_length=1000,
        description="Optional question about this project.",
    )