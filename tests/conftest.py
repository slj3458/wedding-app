import pytest_asyncio
from httpx import AsyncClient, ASGITransport

from app.main import app
from app import database as db_module
from app.routers import admin as admin_module
from app.routers import gallery as gallery_module


@pytest_asyncio.fixture
async def client(tmp_path, monkeypatch):
    # Redirect DB to a per-test temp file
    monkeypatch.setattr(db_module, "DATABASE_PATH", tmp_path / "test.db")

    # Redirect file storage to tmp_path subdirs
    uploads = tmp_path / "uploads"
    thumbs = tmp_path / "thumbnails"
    uploads.mkdir()
    thumbs.mkdir()
    monkeypatch.setattr(gallery_module, "UPLOAD_DIR", uploads)
    monkeypatch.setattr(gallery_module, "THUMB_DIR", thumbs)

    # Clear admin session state
    admin_module.active_tokens.clear()

    # Init schema (lifespan does not fire in ASGITransport)
    await db_module.init_db()

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac
