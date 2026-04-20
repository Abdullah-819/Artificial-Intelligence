from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
import torch
import re
from typing import List
from app.core.config import settings

class SummarizerService:
    def __init__(self):
        # Use the model name from settings
        self.model_name = settings.MODEL_NAME
        
        print(f"Loading summarization model: {self.model_name}")
        self.tokenizer = AutoTokenizer.from_pretrained(self.model_name)
        self.model = AutoModelForSeq2SeqLM.from_pretrained(self.model_name)
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.model.to(self.device)

    def summarize(self, text: str) -> str:
        """
        Generate a concise summary for the given text.
        """
        # Truncate if the text is too long for the model
        max_input_length = 1024
        
        # Prepare inputs
        inputs = self.tokenizer(
            text, 
            max_length=max_input_length, 
            truncation=True, 
            return_tensors="pt"
        ).to(self.device)
        
        # Generate summary
        summary_ids = self.model.generate(
            inputs["input_ids"], 
            num_beams=4, 
            max_length=150, 
            min_length=40, 
            early_stopping=True
        )
        
        summary = self.tokenizer.decode(summary_ids[0], skip_special_tokens=True)
        return summary

    def extract_key_points(self, summary: str) -> List[str]:
        """
        Extract key points from the summary as bullet points.
        For simplicity, we split by common sentence delimiters and format as list.
        """
        sentences = re.split(r'\. |\? |\! ', summary)
        # Filter for non-empty, meaningful sentences
        key_points = [s.strip() + "." for s in sentences if len(s.strip()) > 10]
        # Return first 3-5 key points
        return key_points[:5]

# Using a global singleton pattern to avoid reloading model across requests
nlp_service = SummarizerService()
