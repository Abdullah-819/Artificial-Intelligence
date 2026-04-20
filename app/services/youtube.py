import re
from youtube_transcript_api import YouTubeTranscriptApi, TranscriptsDisabled, NoTranscriptFound
from app.exceptions.handlers import VideoTranscriptError, InvalidYouTubeURLError

class YouTubeService:
    @staticmethod
    def extract_video_id(url: str) -> str:
        """
        Extract the video ID from a YouTube URL.
        Supports standard links, short links, embed links, shorts, and live streams.
        """
        # Improved regex to handle shorts, live, and various query parameters
        patterns = [
            r'(?:v=|\/|embed\/|youtu.be\/|\?v=|shorts\/|live\/)([a-zA-Z0-9_-]{11})',
            r'^([a-zA-Z0-9_-]{11})$' # Also handle raw ID
        ]
        
        for pattern in patterns:
            match = re.search(pattern, url)
            if match:
                return match.group(1)
        
        raise InvalidYouTubeURLError(f"Not a valid YouTube URL: {url}")

    def _clean_text(self, text: str) -> str:
        """
        Cleans the transcript by removing non-speech sounds and formatting artifacts.
        """
        # Remove anything inside brackets (e.g., [Music], [Applause], [Laughter])
        text = re.sub(r'\[.*?\]', '', text)
        
        # Remove anything inside parentheses (occasional auto-gen artifact)
        text = re.sub(r'\(.*?\)', '', text)
        
        # Remove extra whitespace and newlines
        text = re.sub(r'\s+', ' ', text).strip()
        
        return text

    def get_transcript(self, video_id: str) -> str:
        """
        Fetch and clean transcript for a given YouTube video ID.
        """
        try:
            api = YouTubeTranscriptApi()
            transcript_list = api.list(video_id)
            
            try:
                transcript = transcript_list.find_transcript(['en', 'ur', 'hi', 'en-GB', 'en-US'])
            except NoTranscriptFound:
                transcript = next(iter(transcript_list))
            
            fetched_transcript = transcript.fetch()
            
            # Combine the segments
            raw_transcript = " ".join([
                entry.text if hasattr(entry, 'text') else entry['text'] 
                for entry in fetched_transcript
            ])
            
            # Clean the text to remove [Music], etc.
            full_transcript = self._clean_text(raw_transcript)
            
            if not full_transcript:
                raise VideoTranscriptError("The cleaned transcript is empty.")
                
            return full_transcript

        except TranscriptsDisabled:
            raise VideoTranscriptError("Transcripts are disabled for this video.")
        except NoTranscriptFound:
            raise VideoTranscriptError("No transcript found for this video.")
        except Exception as e:
            # Capture specific YouTube blocking messages
            error_msg = str(e)
            if "BOT_DETECTED" in error_msg or "blocked" in error_msg.lower():
                raise VideoTranscriptError("YouTube is temporarily blocking requests from this IP. Please try again later or use a different video.")
            raise VideoTranscriptError(f"Error while fetching transcript: {error_msg}")

    async def get_video_info(self, url: str) -> dict:
        """
        Fetches metadata (title, thumbnail) for the video using YouTube's OEmbed.
        """
        import httpx
        try:
            oembed_url = f"https://www.youtube.com/oembed?url={url}&format=json"
            async with httpx.AsyncClient() as client:
                response = await client.get(oembed_url)
                if response.status_code == 200:
                    data = response.json()
                    return {
                        "title": data.get("title"),
                        "thumbnail": data.get("thumbnail_url"),
                        "author": data.get("author_name")
                    }
        except:
            pass
        return {"title": "YouTube Video", "thumbnail": "", "author": "Unknown"}

youtube_service = YouTubeService()
