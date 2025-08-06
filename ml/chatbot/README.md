# JobSync Gemini Chatbot

This chatbot uses Google Gemini Pro via Flask and a modern frontend. Follow these steps to run and test it locally.


## Prerequisites
- Python 3.8+
- Node.js (optional, for main app)
- A valid Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
- Flask-Limiter (for rate limiting)

## Setup

1. **Clone the repository** (if not already):
   ```sh
   git clone <your-repo-url>
   cd JobSync_A/ml/chatbot
   ```

2. **Create and configure `.env` file:**
   - In `ml/chatbot/.env`, add:
     ```
     GEMINI_API_KEY=your_actual_api_key_here
     ```


3. **Install Python dependencies:**
   ```sh
   pip install flask flask-cors python-dotenv google-generativeai Flask-Limiter
   ```

4. **(Optional) Check available Gemini models:**
   - Run this snippet to see available models for your API key:
     ```python
     import google.generativeai as genai
     from dotenv import load_dotenv
     import os
     load_dotenv()
     genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
     models = genai.list_models()
     print("Available models:")
     for model in models:
         print(model.name)
     ```
   - Update your code to use the correct model name if needed.


## Running the Chatbot

1. **Start the Flask server:**
   ```sh
   python main.py
   ```
   - The server will run at `http://localhost:5000/`

2. **Access the chatbot UI:**
   - Open your browser and go to:
     ```
     http://localhost:5000/
     ```
   - You should see the chatbot interface. Type a message and click "Send".

## Features & Security Improvements

- **Input Validation & Sanitization:**
  - All chatbot messages are validated for type, length, and content before processing.
  - Messages are sanitized to remove dangerous characters and excessive whitespace.

- **Session Management & Cleanup:**
  - Conversation history is stored per session (in-memory for dev).
  - Automatic cleanup of expired/inactive sessions prevents memory leaks.

- **CORS Configuration:**
  - Only trusted origins are allowed to access the API endpoints.

- **Rate Limiting Protection:**
  - The `/api/chat` endpoint is protected by Flask-Limiter (default: 10 requests/minute per IP).

- **Comprehensive Error Handling:**
  - All API failures, LLM errors, and invalid responses are logged and return clear error messages to the frontend.

- **Modular LLM Integration:**
  - Gemini API logic is separated into `models/chat_model.py` for maintainability.

- **Validation Utilities:**
  - Input validation and sanitization logic is in `utils/validators.py` for reuse.


## Troubleshooting
- If you see errors about the Gemini model, upgrade the Python package:
  ```sh
  pip install --upgrade google-generativeai
  ```
- If you see API key errors, double-check your `.env` file and key permissions in Google AI Studio.
- If you see rate limit errors, wait a minute before retrying or adjust the limit in `main.py`.
- Check your terminal for error logs for more details.


## Customization
- Edit `main.py` for backend logic, rate limits, and error handling.
- Edit `models/chat_model.py` for Gemini API integration and session logic.
- Edit `utils/validators.py` for input validation rules.
- Edit `templates/index.html` for frontend UI.

## Contact
For help, open an issue or contact the JobSync team.
