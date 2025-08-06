import os
import google.generativeai as genai
import logging
from config import Config

# Configure logging
logger = logging.getLogger(__name__)

SYSTEM_CONTEXT = """
You are JobSync AI, an expert career assistant. You help users with job search, resume tips, interview preparation, career advice, and job market insights. Always provide clear, actionable, and friendly responses. If a user asks for a job recommendation, ask for their skills, experience, and preferences. If they ask for resume help, offer suggestions to improve their resume. For interview prep, give common questions and tips. For career advice, be supportive and data-driven. Keep answers concise and relevant to jobs and careers.
"""

# Store conversation history per session (in production, use Redis or database)
conversation_sessions = {}

genai.configure(api_key=Config.GEMINI_API_KEY)

def get_gemini_response(message, session_id=None):
    try:
        # Initialize conversation history for this session if it doesn't exist
        if session_id and session_id not in conversation_sessions:
            conversation_sessions[session_id] = []
        
        # Create the model
        model = genai.GenerativeModel("models/gemini-1.5-pro")
        
        # Build conversation history with system context
        history = [{"role": "user", "parts": [SYSTEM_CONTEXT]}]
        
        # Add previous conversation if session exists
        if session_id and session_id in conversation_sessions:
            for msg in conversation_sessions[session_id]:
                history.append(msg)
        
        # Start chat with history
        chat = model.start_chat(history=history)
        
        # Send current message
        response = chat.send_message(message)
        
        # Store conversation in session
        if session_id:
            conversation_sessions[session_id].extend([
                {"role": "user", "parts": [message]},
                {"role": "model", "parts": [response.text]}
            ])
        
        return response.text
        
    except Exception as e:
        logger.error(f"Error getting Gemini response: {str(e)}")
        return "I apologize, but I'm experiencing technical difficulties. Please try again in a moment."

# Usage:
# from models.chat_model import get_gemini_response
# reply = get_gemini_response("Hello!", session_id="abc123")
