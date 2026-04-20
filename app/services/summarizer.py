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
        Includes a safety check for non-English characters to avoid garbage output.
        """
        # Truncate if the text is too long
        max_input_length = 1024
        
        # Safety Check: If more than 30% of characters are non-ASCII,
        # distilbart will produce garbage.
        non_ascii = len([c for c in text[:500] if ord(c) > 127])
        if non_ascii > (min(len(text), 500) * 0.3):
            return "Note: This video contains non-English speech. Summarization is currently optimized for English, but you can still view the full transcript below."

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

    def analyze_sentiment(self, text: str) -> str:
        """
        Heuristic-based sentiment analysis for speed and reliability.
        """
        positive_words = ['good', 'great', 'excellent', 'amazing', 'happy', 'success', 'love', 'positive', 'win']
        negative_words = ['bad', 'poor', 'fail', 'error', 'hate', 'negative', 'wrong', 'sad', 'loss', 'war', 'death']
        
        text_lower = text.lower()
        pos_count = sum(1 for word in positive_words if word in text_lower)
        neg_count = sum(1 for word in negative_words if word in text_lower)
        
        if pos_count > neg_count: return "Positive"
        if neg_count > pos_count: return "Negative"
        return "Neutral"

    def simplify(self, summary: str) -> str:
        """
        Condenses the summary into a single, extremely simple line.
        """
        # We use a specific instruction-like approach or just aggressive truncation
        # For this model, we'll generate a very short sequence
        inputs = self.tokenizer(
            "Summarize this in one very simple sentence for a child: " + summary,
            max_length=512,
            truncation=True,
            return_tensors="pt"
        ).to(self.device)
        
        summary_ids = self.model.generate(
            inputs["input_ids"],
            max_length=40,
            min_length=10,
            do_sample=False
        )
        
        one_liner = self.tokenizer.decode(summary_ids[0], skip_special_tokens=True)
        # Clean up any "Summarize this..." prefix if the model repeats it
        one_liner = one_liner.replace("Summarize this in one very simple sentence for a child: ", "")
        return one_liner

    def translate_to_language(self, text: str, target_lang: str = 'ur') -> str:
        """
        Translates the given text into the target language (default: Urdu).
        Now with robust null-checking to prevent 500 errors.
        """
        from deep_translator import GoogleTranslator
        if not text or len(text.strip()) == 0:
            return "No text provided for translation."
            
        try:
            translated = GoogleTranslator(source='auto', target=target_lang).translate(text)
            if translated:
                return str(translated)
            return "Translation service returned an empty result. Please try again."
        except Exception as e:
            print(f"CRITICAL Translation Error: {str(e)}")
            return "The translation service is currently busy. Please wait a moment and try again."

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
