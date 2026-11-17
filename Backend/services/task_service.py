from sqlalchemy.orm import Session
from sqlalchemy import or_

from models.models import User, UserRole
from models.project import Project
from models.task import Task, TaskStatus
from models.task_activity import TaskActivity, TaskComment


def validate_project_member(
    db: Session,
    project_id: int,
    member_id: int | None,
):
    project = db.query(Project).filter(
        Project.id == project_id
    ).first()

    if project is None:
        raise ValueError("Project not found.")

    if member_id is None:
        return project, None

    member = db.query(User).filter(
        User.id == member_id,
        User.role == UserRole.TEAM_MEMBER,
        User.is_active.is_(True),
    ).first()

    if member is None:
        raise ValueError("Active team member not found.")

    if member not in project.members:
        raise ValueError(
            "Team member must be assigned to the project first."
        )

    return project, member


def record_activity(
    db: Session,
    task_id: int,
    user_id: int,
    action: str,
    details: str | None = None,
):
    activity = TaskActivity(
        task_id=task_id,
        user_id=user_id,
        action=action,
        details=details,
    )

    db.add(activity)


def create_task(
    db: Session,
    project_id: int,
    task_data,
    admin: User,
):
    _, member = validate_project_member(
        db,
        project_id,
        task_data.assigned_to_id,
    )

    task = Task(
        title=task_data.title,
        description=task_data.description,
        priority=task_data.priority,
        due_date=task_data.due_date,
        project_id=project_id,
        assigned_to_id=member.id if member else None,
        created_by_id=admin.id,
    )

    db.add(task)
    db.flush()

    record_activity(
        db,
        task.id,
        admin.id,
        "TASK_CREATED",
        f"Task '{task.title}' created.",
    )

    if member:
        record_activity(
            db,
            task.id,
            admin.id,
            "TASK_ASSIGNED",
            f"Task assigned to {member.name}.",
        )

    db.commit()
    db.refresh(task)

    return task


def get_tasks(
    db: Session,
    project_id: int,
    current_user: User,
    search=None,
    status=None,
    priority=None,
    skip=0,
    limit=10,
):
    project = db.query(Project).filter(
        Project.id == project_id
    ).first()

    if project is None:
        raise ValueError("Project not found.")

    if current_user.role != UserRole.ADMIN:
        if current_user not in project.members:
            raise PermissionError("You are not assigned to this project.")

    query = db.query(Task).filter(
        Task.project_id == project_id
    )

    if current_user.role != UserRole.ADMIN:
        query = query.filter(
            Task.assigned_to_id == current_user.id
        )

    if search:
        query = query.filter(
            or_(
                Task.title.ilike(f"%{search}%"),
                Task.description.ilike(f"%{search}%"),
            )
        )

    if status:
        query = query.filter(Task.status == status)

    if priority:
        query = query.filter(Task.priority == priority)

    return (
        query.order_by(Task.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def get_task_by_id(
    db: Session,
    task_id: int,
    current_user: User,
):
    task = db.query(Task).filter(
        Task.id == task_id
    ).first()

    if task is None:
        return None

    if current_user.role != UserRole.ADMIN:
        if task.assigned_to_id != current_user.id:
            return None

    return task


def update_task(
    db: Session,
    task: Task,
    task_data,
    current_user: User,
):
    update_data = task_data.model_dump(exclude_unset=True)

    if "assigned_to_id" in update_data:
        _, member = validate_project_member(
            db,
            task.project_id,
            update_data["assigned_to_id"],
        )

        update_data["assigned_to_id"] = (
            member.id if member else None
        )

    for field, value in update_data.items():
        old_value = getattr(task, field)

        if old_value != value:
            setattr(task, field, value)

            record_activity(
                db,
                task.id,
                current_user.id,
                f"{field.upper()}_UPDATED",
                f"{field} changed from {old_value} to {value}.",
            )

    db.commit()
    db.refresh(task)

    return task


def update_task_status(
    db: Session,
    task: Task,
    new_status: TaskStatus,
    current_user: User,
):
    old_status = task.status

    if old_status != new_status:
        task.status = new_status

        record_activity(
            db,
            task.id,
            current_user.id,
            "STATUS_UPDATED",
            f"Status changed from {old_status.value} to {new_status.value}.",
        )

        db.commit()
        db.refresh(task)

    return task


def delete_task(db: Session, task: Task):
    db.delete(task)
    db.commit()


def add_comment(
    db: Session,
    task: Task,
    user: User,
    comment_text: str,
):
    comment = TaskComment(
        task_id=task.id,
        user_id=user.id,
        comment=comment_text,
    )

    db.add(comment)

    record_activity(
        db,
        task.id,
        user.id,
        "COMMENT_ADDED",
        "A new comment was added.",
    )

    db.commit()
    db.refresh(comment)

    return comment


def get_task_comments(db: Session, task_id: int):
    return (
        db.query(TaskComment)
        .filter(TaskComment.task_id == task_id)
        .order_by(TaskComment.created_at.desc())
        .all()
    )


def get_task_activities(db: Session, task_id: int):
    return (
        db.query(TaskActivity)
        .filter(TaskActivity.task_id == task_id)
        .order_by(TaskActivity.created_at.desc())
        .all()
    )