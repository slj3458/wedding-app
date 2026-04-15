import asyncio
import logging
import uuid
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, File, Header, HTTPException, UploadFile
from fastapi.responses import FileResponse

from ..config import STABILITY_API_KEY
from ..database import get_db
from ..utils.caricature import stylize
from ..utils.stability import stylize_via_stability
from .admin import verify_admin_token

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/caricature", tags=["caricature"])

CARICATURE_DIR = Path("uploads/caricatures")
RAW_DIR = CARICATURE_DIR / "raw"
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
MAX_SIZE = 10 * 1024 * 1024  # 10MB


@router.post("/submit")
async def submit_selfie(file: UploadFile = File(...)):
    """Accept a selfie, produce a stylized caricature, return its URLs."""
    file_ext = Path(file.filename or "").suffix.lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(400, "Invalid file type")

    content = await file.read()
    if len(content) > MAX_SIZE:
        raise HTTPException(400, "File too large")

    RAW_DIR.mkdir(parents=True, exist_ok=True)
    CARICATURE_DIR.mkdir(parents=True, exist_ok=True)

    token = uuid.uuid4().hex
    raw_filename = f"{token}{file_ext}"
    out_filename = f"{token}.jpg"
    raw_path = RAW_DIR / raw_filename
    out_path = CARICATURE_DIR / out_filename

    raw_path.write_bytes(content)

    try:
        if STABILITY_API_KEY:
            logger.info("Caricature: using Stability API for %s", raw_filename)
            await stylize_via_stability(raw_path, out_path)
        else:
            logger.info("Caricature: using local OpenCV fallback for %s", raw_filename)
            await asyncio.to_thread(stylize, raw_path, out_path)
    except Exception as exc:
        raise HTTPException(500, f"Stylization failed: {exc}")

    db = await get_db()
    try:
        cursor = await db.execute(
            """INSERT INTO caricatures (filename, raw_filename, original_filename)
               VALUES (?, ?, ?)""",
            (out_filename, raw_filename, file.filename),
        )
        await db.commit()
        caricature_id = cursor.lastrowid
    finally:
        await db.close()

    return {
        "id": caricature_id,
        "filename": out_filename,
        "image_url": f"/api/caricature/{out_filename}",
        "download_url": f"/api/caricature/{out_filename}/download",
    }


@router.get("/recent")
async def recent_caricatures(authorization: Optional[str] = Header(None)):
    """Admin-only listing for cleanup/moderation."""
    verify_admin_token(authorization)

    db = await get_db()
    try:
        cursor = await db.execute(
            """SELECT * FROM caricatures
               WHERE hidden = 0
               ORDER BY created_at DESC
               LIMIT 100"""
        )
        rows = await cursor.fetchall()
    finally:
        await db.close()

    return {"caricatures": [dict(row) for row in rows]}


@router.get("/{filename}")
async def get_caricature(filename: str):
    path = CARICATURE_DIR / filename
    if not path.exists() or ".." in filename or "/" in filename:
        raise HTTPException(404, "Caricature not found")
    return FileResponse(path)


@router.get("/{filename}/download")
async def download_caricature(filename: str):
    path = CARICATURE_DIR / filename
    if not path.exists() or ".." in filename or "/" in filename:
        raise HTTPException(404, "Caricature not found")
    return FileResponse(
        path,
        media_type="image/jpeg",
        filename="wedding-caricature.jpg",
        headers={"Content-Disposition": 'attachment; filename="wedding-caricature.jpg"'},
    )
