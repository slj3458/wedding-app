from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class PhotoUpload(BaseModel):
    id: Optional[int] = None
    filename: str
    original_filename: str
    caption: Optional[str] = None
    uploaded_by: Optional[str] = None
    uploaded_at: datetime = datetime.now()
    likes: int = 0

class GuestbookEntry(BaseModel):
    id: Optional[int] = None
    name: str
    message: str
    created_at: datetime = datetime.now()
