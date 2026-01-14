from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from fastapi.responses import FileResponse
from pathlib import Path
import uuid
from PIL import Image
from ..database import get_db
from ..websocket.manager import manager
import aiosqlite

router = APIRouter(prefix="/api/gallery", tags=["gallery"])

UPLOAD_DIR = Path("uploads")
THUMB_DIR = Path("thumbnails")
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
MAX_SIZE = 10 * 1024 * 1024  # 10MB

async def create_thumbnail(image_path: Path, thumb_path: Path, size=(400, 400)):
    """Create thumbnail from uploaded image"""
    with Image.open(image_path) as img:
        # Convert to RGB if necessary
        if img.mode in ('RGBA', 'LA', 'P'):
            img = img.convert('RGB')

        # Create thumbnail
        img.thumbnail(size, Image.Resampling.LANCZOS)
        img.save(thumb_path, 'JPEG', quality=85, optimize=True)

@router.post("/upload")
async def upload_photo(
    file: UploadFile = File(...),
    caption: str = Form(None),
    uploaded_by: str = Form(None)
):
    """Upload a photo to the gallery"""

    # Validate file extension
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(400, "Invalid file type")

    # Generate unique filename
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = UPLOAD_DIR / unique_filename
    thumb_path = THUMB_DIR / f"{unique_filename}.jpg"

    # Save original file
    content = await file.read()
    if len(content) > MAX_SIZE:
        raise HTTPException(400, "File too large")

    with open(file_path, "wb") as f:
        f.write(content)

    # Create thumbnail
    await create_thumbnail(file_path, thumb_path)

    # Save to database
    db = await get_db()
    cursor = await db.execute(
        """INSERT INTO photos (filename, original_filename, caption, uploaded_by)
           VALUES (?, ?, ?, ?)""",
        (unique_filename, file.filename, caption, uploaded_by)
    )
    await db.commit()
    photo_id = cursor.lastrowid

    # Broadcast to WebSocket clients
    await manager.broadcast({
        "type": "new_photo",
        "data": {
            "id": photo_id,
            "filename": unique_filename,
            "caption": caption,
            "uploaded_by": uploaded_by
        }
    })

    await db.close()

    return {
        "id": photo_id,
        "filename": unique_filename,
        "message": "Photo uploaded successfully"
    }

@router.get("/photos")
async def get_photos(skip: int = 0, limit: int = 50):
    """Get all photos with pagination"""
    db = await get_db()

    cursor = await db.execute(
        """SELECT * FROM photos
        WHERE hidden = 0
        ORDER BY uploaded_at DESC
        LIMIT ? OFFSET ?""",
        (limit, skip)
    )
    photos = await cursor.fetchall()

    # Get total count
    cursor = await db.execute("SELECT COUNT(*) FROM photos WHERE hidden = 0")
    total = (await cursor.fetchone())[0]

    await db.close()

    return {
        "photos": [dict(row) for row in photos],
        "total": total,
        "skip": skip,
        "limit": limit
    }

@router.get("/photo/{filename}")
async def get_photo(filename: str):
    """Serve a photo file"""
    file_path = UPLOAD_DIR / filename
    if not file_path.exists():
        raise HTTPException(404, "Photo not found")
    return FileResponse(file_path)

@router.get("/thumbnail/{filename}")
async def get_thumbnail(filename: str):
    """Serve a thumbnail"""
    # Thumbnails are always .jpg
    thumb_filename = f"{Path(filename).stem}{Path(filename).suffix}.jpg"
    thumb_path = THUMB_DIR / thumb_filename

    if not thumb_path.exists():
        raise HTTPException(404, "Thumbnail not found")
    return FileResponse(thumb_path)

@router.post("/photo/{photo_id}/like")
async def like_photo(photo_id: int):
    """Increment likes on a photo"""
    db = await get_db()

    await db.execute(
        "UPDATE photos SET likes = likes + 1 WHERE id = ?",
        (photo_id,)
    )
    await db.commit()

    # Get updated like count
    cursor = await db.execute(
        "SELECT likes FROM photos WHERE id = ?",
        (photo_id,)
    )
    row = await cursor.fetchone()
    await db.close()

    if not row:
        raise HTTPException(404, "Photo not found")

    # Broadcast update
    await manager.broadcast({
        "type": "photo_liked",
        "data": {"id": photo_id, "likes": row[0]}
    })

    return {"id": photo_id, "likes": row[0]}
