import aiosqlite
from pathlib import Path

DATABASE_PATH = Path("data/wedding.db")

async def init_db():
    """Initialize database with tables"""
    DATABASE_PATH.parent.mkdir(exist_ok=True)

    async with aiosqlite.connect(DATABASE_PATH) as db:
        # Photos table
        await db.execute("""
            CREATE TABLE IF NOT EXISTS photos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                filename TEXT NOT NULL,
                original_filename TEXT NOT NULL,
                caption TEXT,
                uploaded_by TEXT,
                uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                likes INTEGER DEFAULT 0,
                hidden INTEGER DEFAULT 0
            )
        """)

        # Guestbook table
        await db.execute("""
            CREATE TABLE IF NOT EXISTS guestbook (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                message TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                hidden INTEGER DEFAULT 0
            )
        """)

        await db.commit()

async def get_db():
    """Get database connection"""
    db = await aiosqlite.connect(DATABASE_PATH)
    db.row_factory = aiosqlite.Row
    return db
