
from youtube_transcript_api import YouTubeTranscriptApi

video_id = "O2vG9tndp2s"
try:
    print(f"Listing transcripts for {video_id}...")
    api = YouTubeTranscriptApi()
    transcript_list = api.list(video_id)
    for t in transcript_list:
        print(f"Found: {t.language_code} ({t.language}) - Generated: {t.is_generated}")
except Exception as e:
    print(f"Error: {e}")
