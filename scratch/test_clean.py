
import re

def clean_text(text: str) -> str:
    # Remove anything inside brackets (e.g., [Music], [Applause], [Laughter])
    text = re.sub(r'\[.*?\]', '', text)
    # Remove anything inside parentheses (occasional auto-gen artifact)
    text = re.sub(r'\(.*?\)', '', text)
    # Remove extra whitespace and newlines
    text = re.sub(r'\s+', ' ', text).strip()
    return text

test_input = "Hello [Music] world (Applause). This is a test [Laughter].   Multiple    spaces."
expected = "Hello world . This is a test . Multiple spaces."
result = clean_text(test_input)
print(f"Input: {test_input}")
print(f"Result: {result}")
if result == expected:
    print("Test Passed!")
else:
    print("Test Failed!")
