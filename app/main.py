from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from pathlib import Path

from .database import init_db
from .routers import gallery, guestbook, admin
from .websocket.manager import manager

# Lifespan context manager for startup/shutdown
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await init_db()
    Path("uploads").mkdir(exist_ok=True)
    Path("thumbnails").mkdir(exist_ok=True)
    yield
    # Shutdown
    pass

app = FastAPI(
    title="Wedding Reception App",
    description="Interactive photo gallery and digital guestbook",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(gallery.router)
app.include_router(guestbook.router)
app.include_router(admin.router)

# WebSocket endpoint
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection alive
            data = await websocket.receive_text()
            # Echo back for heartbeat
            await websocket.send_text(f"pong: {data}")
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@app.get("/")
async def root():
    return {
        "message": "Wedding Reception App API",
        "version": "1.0.0",
        "endpoints": {
            "photos": "/api/gallery/photos",
            "guestbook": "/api/guestbook/entries",
            "websocket": "/ws"
        }
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# Serve frontend static files in production
from fastapi.staticfiles import StaticFiles
from pathlib import Path

# Get the frontend build directory
frontend_dist = Path(__file__).parent.parent / "frontend" / "dist"

# Only mount if the dist folder exists (production)
if frontend_dist.exists():
    app.mount("/", StaticFiles(directory=str(frontend_dist), html=True), name="static")