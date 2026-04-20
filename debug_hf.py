from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
import torch

model_name = "sshleifer/distilbart-cnn-12-6"

try:
    print(f"Loading tokenizer: {model_name}")
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    print(f"Loading model: {model_name}")
    model = AutoModelForSeq2SeqLM.from_pretrained(model_name)
    print("Successfully loaded model and tokenizer manualy")

    text = "The quick brown fox jumps over the lazy dog."
    inputs = tokenizer(text, return_tensors="pt", truncation=True)
    outputs = model.generate(**inputs)
    summary = tokenizer.decode(outputs[0], skip_special_tokens=True)
    print(f"Summary: {summary}")

except Exception as e:
    print(f"Error: {e}")
