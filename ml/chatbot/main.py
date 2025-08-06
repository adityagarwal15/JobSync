
from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import logging
from dotenv import load_dotenv
load_dotenv()

# Rate limiting
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Import LLM integration from chat_model.py
from models.chat_model import get_gemini_response, conversation_sessions
from utils.validators import validate_message, sanitize_message

# Flask app setup
app = Flask(__name__)
# Proper CORS settings
CORS(app, resources={r"/api/*": {"origins": [
    "https://jobsync-new.onrender.com",
    "https://jobsyncc.netlify.app",
    "http://localhost:3000"
]}}, supports_credentials=True)

# Rate limiter setup
limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=["100 per minute"]
)
import threading
import time

# Session cleanup to prevent memory leaks
SESSION_TIMEOUT = 30 * 60  # 30 minutes
CLEANUP_INTERVAL = 10 * 60  # 10 minutes

def cleanup_sessions():
    while True:
        now = time.time()
        to_delete = []
        for session_id, session in list(conversation_sessions.items()):
            last_active = session[-1]['timestamp'] if session and 'timestamp' in session[-1] else None
            if last_active and now - last_active > SESSION_TIMEOUT:
                to_delete.append(session_id)
        for session_id in to_delete:
            del conversation_sessions[session_id]
        logger.info(f"Session cleanup ran. Active sessions: {len(conversation_sessions)}")
        time.sleep(CLEANUP_INTERVAL)

# Start session cleanup thread
cleanup_thread = threading.Thread(target=cleanup_sessions, daemon=True)
cleanup_thread.start()

@app.route('/')
def index():
    """Serve the chatbot HTML page"""
    return render_template('index.html')

@app.route('/api/chat', methods=['POST'])
@limiter.limit("10 per minute")  # Limit to 10 requests per minute per IP
def chat():
    """Handle chat API requests"""
    try:
        data = request.get_json()
        if not data or 'message' not in data:
            return jsonify({'error': 'Message is required'}), 400
        message = data['message']
        valid, validation_msg = validate_message(message)
        if not valid:
            return jsonify({'error': validation_msg}), 400
        message = sanitize_message(message)
        # Get session ID from request (you can implement proper session management)
        session_id = request.headers.get('X-Session-ID', 'default')
        # Get response from Gemini (via chat_model)
        # Add timestamp to message for session cleanup
        import time as _time
        try:
            response = get_gemini_response(message, session_id)
        except Exception as llm_error:
            logger.error(f"LLM API error: {str(llm_error)}")
            return jsonify({'error': 'AI service is currently unavailable. Please try again later.'}), 502

        # Validate LLM response
        if not response or not isinstance(response, str) or response.strip() == "":
            logger.error(f"Empty or invalid response from LLM for session {session_id}")
            return jsonify({'error': 'AI did not return a valid response.'}), 502

        # Add timestamp to last message in session for cleanup
        if session_id in conversation_sessions and conversation_sessions[session_id]:
            conversation_sessions[session_id][-1]['timestamp'] = _time.time()
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