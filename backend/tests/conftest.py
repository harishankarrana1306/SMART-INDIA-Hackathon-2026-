import os
import tempfile
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Create a temporary file for test database
temp_db_fd, temp_db_path = tempfile.mkstemp(suffix=".db")
os.close(temp_db_fd)

os.environ["DATABASE_URL"] = f"sqlite+aiosqlite:///{temp_db_path}"
os.environ["DATABASE_SYNC_URL"] = f"sqlite:///{temp_db_path}"
os.environ["JWT_SECRET"] = "test-jwt-secret-key-sih-2026-testing-suite"

from app.db.base import Base
from app.main import app
from app.db.postgres import get_db
from app.core.security import create_access_token

test_async_engine = create_async_engine(
    f"sqlite+aiosqlite:///{temp_db_path}",
    echo=False,
    future=True,
)

TestAsyncSessionLocal = async_sessionmaker(
    bind=test_async_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

test_sync_engine = create_engine(
    f"sqlite:///{temp_db_path}",
    echo=False,
    future=True,
)
TestSyncSessionLocal = sessionmaker(
    bind=test_sync_engine,
    autocommit=False,
    autoflush=False,
)


@pytest.fixture(scope="session", autouse=True)
def setup_test_database():
    Base.metadata.create_all(bind=test_sync_engine)
    yield
    Base.metadata.drop_all(bind=test_sync_engine)
    if os.path.exists(temp_db_path):
        try:
            os.remove(temp_db_path)
        except Exception:
            pass


@pytest_asyncio.fixture(scope="function")
async def db_session():
    async with TestAsyncSessionLocal() as session:
        yield session


@pytest_asyncio.fixture(scope="function")
async def client(db_session):
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as ac:
        yield ac

    app.dependency_overrides.clear()


@pytest.fixture
def auth_headers():
    def _make_headers(user_id: str, role: str, username: str):
        token = create_access_token(
            subject=user_id,
            role=role,
            username=username,
            full_name=f"Test {role.capitalize()}",
        )
        return {"Authorization": f"Bearer {token}"}
    return _make_headers
