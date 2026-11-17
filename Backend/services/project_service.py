from sqlalchemy.orm import Session, selectinload
from sqlalchemy import or_

from models.models import User, UserRole
from models.project import Project, ProjectStatus
from schemas.project import ProjectCreate, ProjectUpdate


def get_project_members(db: Session, member_ids: list[int]):
    if not member_ids:
        return []

    # Remove duplicate IDs
    member_ids = list(set(member_ids))

    members = (
        db.query(User)
        .filter(
            User.id.in_(member_ids),
            User.is_active.is_(True),
            User.role == UserRole.TEAM_MEMBER,
        )
        .all()
    )

    if len(members) != len(member_ids):
        raise ValueError(
            "One or more team members do not exist, are inactive, "
            "or are not team members."
        )

    return members


def create_project(
    db: Session,
    project_data: ProjectCreate,
    admin: User,
):
    members = get_project_members(db, project_data.member_ids)

    project = Project(
        name=project_data.name,
        description=project_data.description,
        start_date=project_data.start_date,
        deadline=project_data.deadline,
        status=project_data.status,
        created_by_id=admin.id,
        members=members,
    )

    db.add(project)
    db.commit()
    db.refresh(project)

    return project


def get_projects(
    db: Session,
    current_user: User,
    search: str | None = None,
    status: ProjectStatus | None = None,
    skip: int = 0,
    limit: int = 10,
):
    query = db.query(Project).options(
        selectinload(Project.members)
    )

    # Admin can view all projects.
    # Team members can only view their assigned projects.
    if current_user.role != UserRole.ADMIN:
        query = query.filter(
            Project.members.any(User.id == current_user.id)
        )

    if search:
        query = query.filter(
            or_(
                Project.name.ilike(f"%{search}%"),
                Project.description.ilike(f"%{search}%"),
            )
        )

    if status:
        query = query.filter(Project.status == status)

    return (
        query.order_by(Project.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def get_project_by_id(
    db: Session,
    project_id: int,
    current_user: User,
):
    query = db.query(Project).options(
        selectinload(Project.members)
    ).filter(Project.id == project_id)

    if current_user.role != UserRole.ADMIN:
        query = query.filter(
            Project.members.any(User.id == current_user.id)
        )

    return query.first()


def update_project(
    db: Session,
    project: Project,
    project_data: ProjectUpdate,
):
    update_data = project_data.model_dump(exclude_unset=True)

    member_ids = update_data.pop("member_ids", None)

    new_start_date = update_data.get("start_date", project.start_date)
    new_deadline = update_data.get("deadline", project.deadline)

    if new_deadline < new_start_date:
        raise ValueError("Deadline cannot be before start date.")

    for field, value in update_data.items():
        setattr(project, field, value)

    if member_ids is not None:
        project.members = get_project_members(db, member_ids)

    db.commit()
    db.refresh(project)

    return project


def delete_project(db: Session, project: Project):
    db.delete(project)
    db.commit()