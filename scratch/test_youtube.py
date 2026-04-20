
import re
from youtube_transcript_api import YouTubeTranscriptApi

def extract_video_id(url: str) -> str:
    # Existing regex
    # regex = r'(?:v=|\/|embed\/|youtu.be\/|\?v=)([a-zA-Z0-9_-]{11})'
    
    # More robust regex
    regex = r'(?:v=|\/|embed\/|youtu.be\/|\?v=|shorts\/)([a-zA-Z0-9_-]{11})'
    match = re.search(regex, url)
    if not match:
        return None
    return match.group(1)

test_urls = [
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "https://youtu.be/dQw4w9WgXcQ",
    "https://www.youtube.com/embed/dQw4w9WgXcQ",
    "https://www.youtube.com/shorts/O2vG9tndp2s",
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10s",
    "https://m.youtube.com/watch?v=dQw4w9WgXcQ",
    "https://www.youtube.com/watch?list=RDdQw4w9WgXcQ&v=dQw4w9WgXcQ",
]

for url in test_urls:
    print(f"URL: {url} -> ID: {extract_video_id(url)}")

# Test transcript fetching with a known video that might have issues
# e.g. a video with only Urdu or Auto-generated captions
# I'll use a placeholder here for testing logic
def get_transcript(video_id):
    try:
        # Default behavior
        # transcript = YouTubeTranscriptApi.get_transcript(video_id)
        
        # Improved behavior: try multiple languages and auto-generated
        transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)
        
        # Try to get English (manual then auto)
        try:
            transcript = transcript_list.find_transcript(['en'])
        except:
            # If no English, get whatever is available
            transcript = transcript_list.find_generated_transcript(['en'])
            
        return "Success"
    except Exception as e:
        return f"Error: {str(e)}"

print(get_transcript("dQw4w9WgXcQ"))
