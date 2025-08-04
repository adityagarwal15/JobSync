import os
import google.generativeai as genai
from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import logging
from dotenv import load_dotenv
load_dotenv()


# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Set your Gemini API key from environment variable for security
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY environment variable not set.")

genai.configure(api_key=GEMINI_API_KEY)

# Flask app setup
app = Flask(__name__)
CORS(app)  # Enable CORS for cross-origin requests

# System context for job-related chatbot
SYSTEM_CONTEXT = """
You are JobSync AI, an expert career assistant. You help users with job search, resume tips, interview preparation, career advice, and job market insights. Always provide clear, actionable, and friendly responses. If a user asks for a job recommendation, ask for their skills, experience, and preferences. If they ask for resume help, offer suggestions to improve their resume. For interview prep, give common questions and tips. For career advice, be supportive and data-driven. Keep answers concise and relevant to jobs and careers.
"""

# Store conversation history per session (in production, use Redis or database)
conversation_sessions = {}

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

@app.route('/')
def index():
    """Serve the chatbot HTML page"""
    return render_template('index.html')

@app.route('/api/chat', methods=['POST'])
def chat():
    """Handle chat API requests"""
    try:
        data = request.get_json()
        
        if not data or 'message' not in data:
            return jsonify({'error': 'Message is required'}), 400
        
        message = data['message'].strip()
        if not message:
            return jsonify({'error': 'Message cannot be empty'}), 400
        
        # Get session ID from request (you can implement proper session management)
        session_id = request.headers.get('X-Session-ID', 'default')
        
        # Get response from Gemini
        response = get_gemini_response(message, session_id)
        
        return jsonify({
            'response': response,
            'status': 'success'
        })
        
    except Exception as e:
        logger.error(f"Chat API error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'service': 'JobSync AI Chatbot'})

if __name__ == "__main__":
    # For development
    app.run(debug=True, host='0.0.0.0', port=5000)
    
    # Uncomment below for command line interface
    # user = input("Enter your name: ")
    # print("Welcome to JobSync AI! How can I help you today?")
    # while True:
    #     message = input(f"{user}: ")
    #     if message.lower() in ["exit", "quit"]:
    #         print("Goodbye!")
    #         break
    #     response = get_gemini_response(message)
    #     print(f"JobSync AI: {response}")