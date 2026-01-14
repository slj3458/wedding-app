# app/routers/admin.py
from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import Optional
from ..database import get_db
from ..config import ADMIN_PASSWORD
from ..websocket.manager import manager
import secrets

router = APIRouter(prefix="/api/admin", tags=["admin"])

# Store active admin tokens (in production, use Redis or database)
active_tokens = set()

class AdminLogin(BaseModel):
    password: str

class AdminAction(BaseModel):
    item_id: int
    item_type: str  # "photo" or "guestbook"
    action: str  # "delete" or "hide" or "unhide"

@router.post("/login")
async def admin_login(credentials: AdminLogin):
    """Admin login - returns a token if password is correct"""
    if credentials.password == ADMIN_PASSWORD:
        # Generate a secure token
        token = secrets.token_urlsafe(32)
        active_tokens.add(token)
        return {
            "success": True,
            "token": token,
            "message": "Admin access granted"
        }
    else:
        raise HTTPException(status_code=401, detail="Invalid password")

@router.post("/logout")
async def admin_logout(authorization: Optional[str] = Header(None)):
    """Admin logout - invalidates the token"""
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
        active_tokens.discard(token)
    return {"success": True, "message": "Logged out"}

def verify_admin_token(authorization: Optional[str] = Header(None)):
    """Verify admin token"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")

    token = authorization.split(" ")[1]
    if token not in active_tokens:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    return True

@router.post("/action")
async def admin_action(
    action_data: AdminAction,
    authorization: Optional[str] = Header(None)
):
    """Perform admin action (delete, hide, unhide)"""
    # Verify admin is authenticated
    verify_admin_token(authorization)

    db = await get_db()

    try:
        if action_data.item_type == "photo":
            if action_data.action == "delete":
                # Delete photo
                await db.execute(
                    "DELETE FROM photos WHERE id = ?",
                    (action_data.item_id,)
                )
                await db.commit()

                # Broadcast deletion
                await manager.broadcast({
                    "type": "photo_deleted",
                    "data": {"id": action_data.item_id}
                })

                message = "Photo deleted successfully"

            elif action_data.action == "hide":
                # Hide photo
                await db.execute(
                    "UPDATE photos SET hidden = 1 WHERE id = ?",
                    (action_data.item_id,)
                )
                await db.commit()

                # Broadcast hide
                await manager.broadcast({
                    "type": "photo_hidden",
                    "data": {"id": action_data.item_id}
                })

                message = "Photo hidden successfully"

            elif action_data.action == "unhide":
                # Unhide photo
                await db.execute(
                    "UPDATE photos SET hidden = 0 WHERE id = ?",
                    (action_data.item_id,)
                )
                await db.commit()

                # Broadcast unhide
                await manager.broadcast({
                    "type": "photo_unhidden",
                    "data": {"id": action_data.item_id}
                })

                message = "Photo unhidden successfully"

        elif action_data.item_type == "guestbook":
            if action_data.action == "delete":
                # Delete guestbook entry
                await db.execute(
                    "DELETE FROM guestbook WHERE id = ?",
                    (action_data.item_id,)
                )
                await db.commit()

                # Broadcast deletion
                await manager.broadcast({
                    "type": "guestbook_deleted",
                    "data": {"id": action_data.item_id}
                })

                message = "Guestbook entry deleted successfully"

            elif action_data.action == "hide":
                # Hide guestbook entry
                await db.execute(
                    "UPDATE guestbook SET hidden = 1 WHERE id = ?",
                    (action_data.item_id,)
                )
                await db.commit()

                # Broadcast hide
                await manager.broadcast({
                    "type": "guestbook_hidden",
                    "data": {"id": action_data.item_id}
                })

                message = "Guestbook entry hidden successfully"

            elif action_data.action == "unhide":
                # Unhide guestbook entry
                await db.execute(
                    "UPDATE guestbook SET hidden = 0 WHERE id = ?",
                    (action_data.item_id,)
                )
                await db.commit()

                # Broadcast unhide
                await manager.broadcast({
                    "type": "guestbook_unhidden",
                    "data": {"id": action_data.item_id}
                })

                message = "Guestbook entry unhidden successfully"

        else:
            raise HTTPException(status_code=400, detail="Invalid item type")

        await db.close()

        return {
            "success": True,
            "message": message
        }

    except Exception as e:
        await db.close()
        raise HTTPException(status_code=500, detail=str(e))
