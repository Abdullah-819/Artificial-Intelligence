from pydantic import BaseModel, HttpUrl
from typing import List, Optional

class SummarizeRequest(BaseModel):
    url: str

class VideoInfo(BaseModel):
    title: Optional[str] = "YouTube Video"
    thumbnail: Optional[str] = ""
    author: Optional[str] = ""

class SummarizeResponse(BaseModel):
    transcript: str
    summary: str
    simple_summary: str
    key_points: List[str]
    metadata: VideoInfo
    sentiment: str = "Neutral"

class TranslationRequest(BaseModel):
    text: str
    target_lang: str = "ur"

class TranslationResponse(BaseModel):
    translated_text: str

class PDFRequest(BaseModel):
    title: str
    content: str

class ErrorResponse(BaseModel):
    detail: str
