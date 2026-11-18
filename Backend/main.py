
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from database import Base, engine, SessionLocal

# Import models before create_all so SQLAlchemy registers their tables.
from models.models import User, UserRole
from models.project import Project, ProjectStatus
from models.task import Task, TaskStatus, TaskPriority
from models.task_activity import TaskComment, TaskActivity

from routers.auth import router as auth_router
from routers.user import router as users_router
from routers.project import router as projects_router
from routers.task import router as tasks_router
from routers.dashboard import router as dashboard_router
from routers.ai import router as ai_router

from utils.security import hash_password


@asynccontextmanager
async def lifespan(app: FastAPI):

    # Create database tables
    Base.metadata.create_all(bind=engine)

    # Create initial admin if it does not exist
    db = SessionLocal()

    try:
        admin = db.query(User).filter(
            User.email == settings.ADMIN_EMAIL
        ).first()

        if admin is None:
            admin = User(
                name=settings.ADMIN_NAME,
                email=settings.ADMIN_EMAIL,
                hashed_password=hash_password(settings.ADMIN_PASSWORD),
                role=UserRole.ADMIN,
                is_active=True,
            )

            db.add(admin)
            db.commit()

            print("Initial admin account created.")

        else:
            print("Admin account already exists.")

    finally:
        db.close()

    yield


app = FastAPI(
    title=settings.APP_NAME,
    description="AI-Powered Project Management System API",
    version="1.0.0",
    lifespan=lifespan,
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        url.strip()
        for url in settings.FRONTEND_URLS.split(",")
        if url.strip()
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routers
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(projects_router)
app.include_router(tasks_router)
app.include_router(dashboard_router)
app.include_router(ai_router)


@app.get("/")
def root():
    return {
        "message": "AI-Powered Project Management System API is running"
    }


@app.get("/health")
def health_check():
    return {"status": "healthy"}
