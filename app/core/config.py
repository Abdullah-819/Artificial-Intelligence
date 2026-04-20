from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "YouTube Video Summarizer"
    MODEL_NAME: str = "sshleifer/distilbart-cnn-12-6"
    MAX_TRANSCRIPT_LENGTH: int = 4000
    
    class Config:
        env_file = ".env"

settings = Settings()
