from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse

class VideoTranscriptError(Exception):
    def __init__(self, message: str):
        self.message = message

class InvalidYouTubeURLError(Exception):
    def __init__(self, message: str):
        self.message = message

async def video_transcript_exception_handler(request: Request, exc: VideoTranscriptError):
    return JSONResponse(
        status_code=404,
        content={"detail": exc.message},
    )

async def invalid_url_exception_handler(request: Request, exc: InvalidYouTubeURLError):
    return JSONResponse(
        status_code=400,
        content={"detail": exc.message},
    )
