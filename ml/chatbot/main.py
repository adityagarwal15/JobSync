import os
import google.generativeai as genai

# Set your Gemini API key from environment variable for security
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY environment variable not set.")

genai.configure(api_key=GEMINI_API_KEY)

# System context for job-related chatbot
SYSTEM_CONTEXT = """
You are JobSync AI, an expert career assistant. You help users with job search, resume tips, interview preparation, career advice, and job market insights. Always provide clear, actionable, and friendly responses. If a user asks for a job recommendation, ask for their skills, experience, and preferences. If they ask for resume help, offer suggestions to improve their resume. For interview prep, give common questions and tips. For career advice, be supportive and data-driven. Keep answers concise and relevant to jobs and careers.
"""

# Format for chat responses
def format_chat(user, message, response):
    return {
        "user": user,
        "message": message,
        "response": response
    }

def get_gemini_response(user, message):
    chat = genai.GenerativeModel("gemini-pro").start_chat(history=[{"role": "system", "parts": [SYSTEM_CONTEXT]}])
    gemini_response = chat.send_message(message)
    return format_chat(user, message, gemini_response.text)

if __name__ == "__main__":
    user = input("Enter your name: ")
    print("Welcome to JobSync AI! How can I help you today?")
    while True:
        message = input(f"{user}: ")
        if message.lower() in ["exit", "quit"]:
            print("Goodbye!")
            break
        response = get_gemini_response(user, message)
        print(f"JobSync AI: {response['response']}")
