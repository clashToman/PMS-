
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

from config import settings


engine = create_engine(
    settings.DATABASE_URL,

    # Verify connections before using them
    pool_pre_ping=True,

    # Recycle connections periodically
    pool_recycle=300,

    # Avoid too many simultaneous connections
    pool_size=5,
    max_overflow=2,

    # Wait for an available connection
    pool_timeout=30,

    # Avoid sharing connections across threads
    connect_args={
        "connect_timeout": 15,
        "read_timeout": 30,
        "write_timeout": 30,
    },
)


SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()
