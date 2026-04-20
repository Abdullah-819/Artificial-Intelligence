from fastapi import APIRouter, HTTPException, Depends
from app.models.schemas import SummarizeRequest, SummarizeResponse
from app.services.youtube import youtube_service
from app.services.summarizer import nlp_service
from app.exceptions.handlers import VideoTranscriptError, InvalidYouTubeURLError

router = APIRouter()

@router.post("/summarize", response_model=SummarizeResponse)
async def summarize_video(request: SummarizeRequest):
    """
    Endpoint to process a YouTube video URL and generate a summary, transcript, and key points.
    Now includes video metadata and sentiment analysis.
    """
    print(f"Processing request for URL: {request.url}")
    
    # Extract YouTube video ID
    video_id = youtube_service.extract_video_id(request.url)
    
    # 1. Fetch Video Metadata (Title, Thumbnail)
    metadata = await youtube_service.get_video_info(request.url)
    
    # 2. Fetch transcript
    try:
        transcript = youtube_service.get_transcript(video_id)
    except Exception as e:
        print(f"DEBUG: YouTube Fetch Error: {str(e)}")
        raise VideoTranscriptError(f"Error while fetching transcript: {str(e)}")
    
    # 3. Generate summary using AI model
    summary = nlp_service.summarize(transcript)
    
    # 4. Extract bullet points
    key_points = nlp_service.extract_key_points(summary)
    
    # 5. Analyze Sentiment
    sentiment = nlp_service.analyze_sentiment(transcript)
    
    return SummarizeResponse(
        transcript=transcript,
        summary=summary,
        key_points=key_points,
        metadata=metadata,
        sentiment=sentiment
    )

