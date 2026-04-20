# YouTube AI Video Summarizer Backend

This backend system is designed using a modular FastAPI architecture, where AI-based summarization is handled in the service layer, ensuring scalability and separation of concerns.

## 🚀 Key Features

- **YouTube Transcript API Integration**: Fetch transcripts for any video with captions.
- **AI-Based Summarization**: Uses a lightweight HuggingFace transformer (`DistilBART`) for performance and accuracy.
- **Modular Architecture**: Clean separation between API endpoints, core logic, schemas, and models.
- **Comprehensive Error Handling**: Handles invalid URLs, missing transcripts, and API failures gracefully.

## 🛠️ Tech Stack

- **FastAPI**: Modern, fast (high-performance) web framework for building APIs.
- **Transformers (HuggingFace)**: State-of-the-art NLP library for AI models.
- **YouTube Transcript API**: Interface for YouTube video transcript extraction.
- **Pydantic**: Data validation and settings management using Python type hints.

## 💡 System Architecture

- `app/api/`: RESTful endpoints definitions.
- `app/services/`: Core logic for URL parsing, transcript fetching, and NLP.
- `app/models/`: Pydantic models for data structures.
- `app/core/`: Application settings and global configuration.
- `app/exceptions/`: Custom error definitions and handlers.
- `app/main.py`: Application entry point.

## ⚙️ Setup and Installation

1. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # Windows: venv\\Scripts\\activate
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Run the application:
   ```bash
   uvicorn app.main:app --reload
   ```
4. Access the API:
   - Base URL: http://127.0.0.1:8000
   - Interactive Swagger Docs: http://127.0.0.1:8000/docs

## 📡 API Usage

**Endpoint:** `POST /summarize`

**Request Body:**
```json
{
  "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
}
```

**Response Body:**
```json
{
  "transcript": "...",
  "summary": "...",
  "key_points": ["point1", "point2", "point3"]
}
```

## 🧠 Presentation Line (for Viva)

“This backend system is designed using a modular FastAPI architecture, where AI-based summarization is handled in the service layer, ensuring scalability and separation of concerns.”
