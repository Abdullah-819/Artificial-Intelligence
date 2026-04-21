from fastapi import APIRouter, HTTPException, Depends, Response
from fastapi.responses import StreamingResponse
from app.models.schemas import (
    SummarizeRequest, 
    SummarizeResponse, 
    TranslationRequest, 
    TranslationResponse,
    PDFRequest
)
from app.services.youtube import youtube_service
from app.services.summarizer import nlp_service
from app.exceptions.handlers import VideoTranscriptError, InvalidYouTubeURLError
import json
import asyncio

router = APIRouter()

@router.post("/download-pdf")
async def download_pdf(request: PDFRequest):
    """
    Endpoint to generate and download a PDF version of the transcription.
    """
    try:
        pdf_bytes = nlp_service.generate_pdf_bytes(request.title, request.content)
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=transcription.pdf"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF Generation failed: {str(e)}")

@router.post("/summarize", response_model=SummarizeResponse)
async def summarize_video(request: SummarizeRequest):
    # (Existing non-streaming endpoint kept for compatibility)
    video_id = youtube_service.extract_video_id(request.url)
    metadata = await youtube_service.get_video_info(request.url)
    try:
        transcript = youtube_service.get_transcript(video_id)
    except Exception as e:
        raise VideoTranscriptError(f"Error while fetching transcript: {str(e)}")
    summary = nlp_service.summarize(transcript)
    simple_summary = nlp_service.simplify(summary)
    key_points = nlp_service.extract_key_points(summary)
    sentiment = nlp_service.analyze_sentiment(transcript)
    
    return SummarizeResponse(
        transcript=transcript,
        summary=summary,
        simple_summary=simple_summary,
        key_points=key_points,
        metadata=metadata,
        sentiment=sentiment
    )

@router.post("/summarize-stream")
async def summarize_video_stream(request: SummarizeRequest):
    """
    Streaming endpoint to provide real-time progression for the summarization process.
    """
    async def progress_generator():
        try:
            # Phase 1: Initialize
            yield f"data: {json.dumps({'progress': 10, 'status': 'Initializing Neural Engine...'})}\n\n"
            await asyncio.sleep(0.5)

            # Phase 2: URL Parsing & Metadata
            yield f"data: {json.dumps({'progress': 25, 'status': 'Extracting Video Intelligence...'})}\n\n"
            video_id = youtube_service.extract_video_id(request.url)
            metadata = await youtube_service.get_video_info(request.url)
            
            # Phase 3: Transcript Extraction
            yield f"data: {json.dumps({'progress': 45, 'status': 'Fetching Signal Transcript...'})}\n\n"
            transcript = youtube_service.get_transcript(video_id)
            
            # Phase 4: AI Processing
            yield f"data: {json.dumps({'progress': 70, 'status': 'Generating AI Summary...'})}\n\n"
            summary = nlp_service.summarize(transcript)
            
            # Phase 5: NLP Analysis
            yield f"data: {json.dumps({'progress': 85, 'status': 'Analyzing Contextual Patterns...'})}\n\n"
            simple_summary = nlp_service.simplify(summary)
            key_points = nlp_service.extract_key_points(summary)
            sentiment = nlp_service.analyze_sentiment(transcript)
            
            # Final Result
            final_data = {
                'progress': 100,
                'status': 'Analysis Complete',
                'result': {
                    'transcript': transcript,
                    'summary': summary,
                    'simple_summary': simple_summary,
                    'key_points': key_points,
                    'metadata': metadata,
                    'sentiment': sentiment
                }
            }
            yield f"data: {json.dumps(final_data)}\n\n"
            
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(progress_generator(), media_type="text/event-stream")

@router.post("/translate", response_model=TranslationResponse)
async def translate_text(request: TranslationRequest):
    # ... (existing code)
    try:
        translated = nlp_service.translate_to_language(request.text, request.target_lang)
        return TranslationResponse(translated_text=translated)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Translation failed: {str(e)}")


