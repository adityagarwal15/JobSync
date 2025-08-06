
from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import logging
from dotenv import load_dotenv
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Import LLM integration from chat_model.py
from models.chat_model import get_gemini_response

# Flask app setup
app = Flask(__name__)
CORS(app)  # Enable CORS for cross-origin requests

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
        # Get response from Gemini (via chat_model)
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