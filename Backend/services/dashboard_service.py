from datetime import date

from sqlalchemy.orm import Session
from sqlalchemy import func

from models.models import User, UserRole
from models.project import Project, ProjectStatus
from models.task import Task, TaskStatus
from models.task_activity import TaskActivity


def get_dashboard_summary(db: Session, current_user: User):

    today = date.today()

    # Base task query
    task_query = db.query(Task)

    # Team members see only their own assigned tasks
    if current_user.role != UserRole.ADMIN:
        task_query = task_query.filter(
            Task.assigned_to_id == current_user.id
        )

    total_tasks = task_query.count()

    todo_tasks = task_query.filter(
        Task.status == TaskStatus.TODO
    ).count()

    in_progress_tasks = task_query.filter(
        Task.status == TaskStatus.IN_PROGRESS
    ).count()

    completed_tasks = task_query.filter(
        Task.status == TaskStatus.COMPLETED
    ).count()

    overdue_tasks = task_query.filter(
        Task.due_date < today,
        Task.status != TaskStatus.COMPLETED
    ).count()

    upcoming_tasks = task_query.filter(
        Task.due_date >= today,
        Task.status != TaskStatus.COMPLETED
    ).order_by(Task.due_date.asc()).limit(5).all()

    # Project statistics
    project_query = db.query(Project)

    if current_user.role != UserRole.ADMIN:
        project_query = project_query.filter(
            Project.members.any(User.id == current_user.id)
        )

    total_projects = project_query.count()

    active_projects = project_query.filter(
        Project.status == ProjectStatus.ACTIVE
    ).count()

    completed_projects = project_query.filter(
        Project.status == ProjectStatus.COMPLETED
    ).count()

    on_hold_projects = project_query.filter(
        Project.status == ProjectStatus.ON_HOLD
    ).count()

    planning_projects = project_query.filter(
        Project.status == ProjectStatus.PLANNING
    ).count()

    cancelled_projects = project_query.filter(
        Project.status == ProjectStatus.CANCELLED
    ).count()

    # Recent activities only from tasks visible to this user
    activity_query = db.query(TaskActivity).join(
        Task,
        TaskActivity.task_id == Task.id
    )

    if current_user.role != UserRole.ADMIN:
        activity_query = activity_query.filter(
            Task.assigned_to_id == current_user.id
        )

    recent_activities = (
        activity_query
        .order_by(TaskActivity.created_at.desc())
        .limit(10)
        .all()
    )

    result = {
        "role": current_user.role.value,
        "projects": {
            "total": total_projects,
            "active": active_projects,
            "completed": completed_projects,
            "on_hold": on_hold_projects,
            "planning": planning_projects,
            "cancelled": cancelled_projects,
        },
        "tasks": {
            "total": total_tasks,
            "todo": todo_tasks,
            "in_progress": in_progress_tasks,
            "completed": completed_tasks,
            "overdue": overdue_tasks,
        },
        "upcoming_tasks": [
            {
                "id": task.id,
                "title": task.title,
                "due_date": task.due_date.isoformat(),
                "priority": task.priority.value,
                "status": task.status.value,
                "project_id": task.project_id,
            }
            for task in upcoming_tasks
        ],
        "recent_activities": [
            {
                "id": activity.id,
                "task_id": activity.task_id,
                "user_id": activity.user_id,
                "action": activity.action,
                "details": activity.details,
                "created_at": activity.created_at.isoformat()
                if activity.created_at else None,
            }
            for activity in recent_activities
        ],
    }

    # Admin-only team workload
    if current_user.role == UserRole.ADMIN:

        team_members = (
            db.query(User)
            .filter(
                User.role == UserRole.TEAM_MEMBER,
                User.is_active.is_(True),
            )
            .all()
        )

        workload = []

        for member in team_members:

            member_tasks = db.query(Task).filter(
                Task.assigned_to_id == member.id
            )

            workload.append({
                "user_id": member.id,
                "name": member.name,
                "total_tasks": member_tasks.count(),
                "todo": member_tasks.filter(
                    Task.status == TaskStatus.TODO
                ).count(),
                "in_progress": member_tasks.filter(
                    Task.status == TaskStatus.IN_PROGRESS
                ).count(),
                "completed": member_tasks.filter(
                    Task.status == TaskStatus.COMPLETED
                ).count(),
            })

        result["team_workload"] = workload

    return result