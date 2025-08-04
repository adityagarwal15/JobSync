# JobSync Gemini Chatbot

This chatbot uses Google Gemini Pro via Flask and a modern frontend. Follow these steps to run and test it locally.

## Prerequisites
- Python 3.8+
- Node.js (optional, for main app)
- A valid Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey)

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
   pip install flask flask-cors python-dotenv google-generativeai
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

## Troubleshooting
- If you see errors about the Gemini model, upgrade the Python package:
  ```sh
  pip install --upgrade google-generativeai
  ```
- If you see API key errors, double-check your `.env` file and key permissions in Google AI Studio.
- Check your terminal for error logs for more details.

## Customization
- Edit `main.py` for backend logic.
- Edit `templates/index.html` for frontend UI.

## Contact
For help, open an issue or contact the JobSync team.
