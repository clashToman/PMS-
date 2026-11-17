import enum

from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Date,
    DateTime,
    ForeignKey,
    Enum,
    Table,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from database import Base


class ProjectStatus(str, enum.Enum):
    PLANNING = "PLANNING"
    ACTIVE = "ACTIVE"
    ON_HOLD = "ON_HOLD"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


# Many-to-many relationship between projects and users
project_members = Table(
    "project_members",
    Base.metadata,
    Column(
        "project_id",
        Integer,
        ForeignKey("projects.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "user_id",
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String(150), nullable=False, index=True)
    description = Column(Text, nullable=True)

    start_date = Column(Date, nullable=False)
    deadline = Column(Date, nullable=False)

    status = Column(
        Enum(ProjectStatus, name="project_status"),
        nullable=False,
        default=ProjectStatus.PLANNING,
    )

    created_by_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    members = relationship(
        "User",
        secondary=project_members,
        lazy="selectin",
    )