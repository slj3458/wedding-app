from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from ..database import get_db
from ..websocket.manager import manager

router = APIRouter(prefix="/api/guestbook", tags=["guestbook"])

class GuestbookEntryCreate(BaseModel):
    name: str
    message: str

@router.post("/entry")
async def create_entry(entry: GuestbookEntryCreate):
    """Create a new guestbook entry"""
    from datetime import datetime

    db = await get_db()

    cursor = await db.execute(
        """INSERT INTO guestbook (name, message)
           VALUES (?, ?)""",
        (entry.name, entry.message)
    )
    await db.commit()
    entry_id = cursor.lastrowid

    # Get the created_at timestamp
    cursor = await db.execute(
        "SELECT datetime(created_at) as created_at FROM guestbook WHERE id = ?",
        (entry_id,)
    )
    result = await cursor.fetchone()
    created_at = result[0] if result else None

    # Convert to ISO format
    if created_at:
        created_at = created_at.replace(' ', 'T') + 'Z'

    # Broadcast to WebSocket clients
    await manager.broadcast({
        "type": "new_guestbook_entry",
        "data": {
            "id": entry_id,
            "name": entry.name,
            "message": entry.message,
            "created_at": created_at
        }
    })

    await db.close()

    return {
        "id": entry_id,
        "name": entry.name,
        "message": entry.message,
        "created_at": created_at
    }

@router.get("/entries")
async def get_entries(skip: int = 0, limit: int = 100):
    """Get all guestbook entries"""
    db = await get_db()

    cursor = await db.execute(
        """SELECT id, name, message,
        datetime(created_at) as created_at
        FROM guestbook
        WHERE hidden = 0
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?""",
        (limit, skip)
)
    entries = await cursor.fetchall()

    cursor = await db.execute("SELECT COUNT(*) FROM guestbook WHERE hidden = 0")
    total = (await cursor.fetchone())[0]

    await db.close()

    # Convert entries to proper format with ISO timestamps
    formatted_entries = []
    for row in entries:
        entry_dict = dict(row)
        # Convert SQLite datetime to ISO format for JavaScript
        if entry_dict['created_at']:
            entry_dict['created_at'] = entry_dict['created_at'].replace(' ', 'T') + 'Z'
        formatted_entries.append(entry_dict)

    return {
        "entries": formatted_entries,
        "total": total
    }
