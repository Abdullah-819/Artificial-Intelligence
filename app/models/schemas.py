from pydantic import BaseModel, HttpUrl
from typing import List, Optional

class SummarizeRequest(BaseModel):
    url: str

class SummarizeResponse(BaseModel):
    transcript: str
    summary: str
    key_points: List[str]

class ErrorResponse(BaseModel):
    detail: str
