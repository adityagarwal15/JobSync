import re

def validate_message(message, min_length=2, max_length=1000):
    """
    Validate chatbot input message.
    - Must be a string
    - Must not be empty or whitespace
    - Must be within min/max length
    - Optionally, can add more rules (e.g., block URLs, profanity)
    """
    if not isinstance(message, str):
        return False, "Message must be a string."
    message = message.strip()
    if not message:
        return False, "Message cannot be empty."
    if len(message) < min_length:
        return False, f"Message must be at least {min_length} characters."
    if len(message) > max_length:
        return False, f"Message must be less than {max_length} characters."
    return True, "Valid message."

def sanitize_message(message):
    """
    Basic sanitization: remove dangerous characters, excessive whitespace, etc.
    You can expand this for more advanced needs.
    """
    # Remove control characters
    message = re.sub(r'[\x00-\x1F\x7F]', '', message)
    # Collapse multiple spaces
    message = re.sub(r'\s+', ' ', message)
    return message.strip()

# Usage in main.py:
# from utils.validators import validate_message, sanitize_message
# valid, msg = validate_message(user_input)
# if valid:
#     user_input = sanitize_message(user_input)
