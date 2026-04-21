from fastapi import FastAPI
from app.api.endpoints import router as api_router
from app.exceptions.handlers import (
    VideoTranscriptError, 
    InvalidYouTubeURLError, 
    video_transcript_exception_handler, 
    invalid_url_exception_handler
)
from app.core.config import settings

from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

app = FastAPI(
    title=settings.APP_NAME,
    description="A backend system that extracts transcripts from YouTube videos and generates an AI summary.",
    version="1.0.0"
)

# Mount static files directory
app.mount("/static", StaticFiles(directory="static"), name="static")

# Register custom exception handlers
app.add_exception_handler(VideoTranscriptError, video_transcript_exception_handler)
app.add_exception_handler(InvalidYouTubeURLError, invalid_url_exception_handler)

# Register routes
app.include_router(api_router, prefix="/api/v1")

@app.get("/")
async def read_root():
    return FileResponse(os.path.join("static", "index.html"))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
