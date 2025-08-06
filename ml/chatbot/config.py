import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Required environment variables for chatbot
REQUIRED_ENV = [
    'GEMINI_API_KEY',
    'MONGODB_URI',
]

missing_env = [key for key in REQUIRED_ENV if not os.getenv(key)]
if missing_env:
    raise EnvironmentError(f"Missing required environment variables: {', '.join(missing_env)}")

# Configuration object
class Config:
    GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
    MONGODB_URI = os.getenv('MONGODB_URI')

# Usage:
# from config import Config
# api_key = Config.GEMINI_API_KEY
