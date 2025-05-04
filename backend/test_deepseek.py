import os
import sys
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_deepseek_api():
    # Get API key from environment variable
    api_key = os.getenv('DEEPSEEK_API_KEY', 'sk-00e8d6a6d92640b49a5d84596101ca6f')
    
    if not api_key:
        print("Error: DeepSeek API key not found in environment variables")
        return False
    
    # Prepare the test request
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    data = {
        "model": "deepseek-chat",
        "messages": [
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": "Hello, can you help me solve this math problem: 2 + 2 = ?"}
        ],
        "temperature": 0.7,
        "max_tokens": 2000
    }
    
    print("Testing DeepSeek API connection...")
    
    try:
        # Make the API request
        response = requests.post(
            "https://api.deepseek.com/v1/chat/completions",
            headers=headers,
            json=data
        )
        
        print(f"API Response Status: {response.status_code}")
        print(f"API Response: {response.text}")
        
        if response.status_code == 200:
            print("✅ DeepSeek API is working correctly!")
            return True
        else:
            print(f"❌ DeepSeek API returned error: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Error connecting to DeepSeek API: {str(e)}")
        return False

if __name__ == "__main__":
    test_deepseek_api() 