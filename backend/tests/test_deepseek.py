import unittest
import os
from dotenv import load_dotenv
import requests

class TestDeepSeekAPI(unittest.TestCase):
    def setUp(self):
        # Load environment variables
        load_dotenv()
        self.api_key = os.getenv('DEEPSEEK_API_KEY')
        self.api_url = "https://api.deepseek.com/v1/chat/completions"
        
        if not self.api_key:
            self.skipTest("DEEPSEEK_API_KEY not found in environment variables")
            
    def test_api_connection(self):
        """Test basic API connection"""
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        data = {
            "model": "deepseek-chat",
            "messages": [
                {"role": "user", "content": "Hello, this is a test message."}
            ]
        }
        
        try:
            response = requests.post(self.api_url, headers=headers, json=data)
            self.assertEqual(response.status_code, 200)
            self.assertIn('choices', response.json())
        except Exception as e:
            self.fail(f"API connection test failed: {str(e)}")
            
    def test_problem_solving(self):
        """Test problem-solving capabilities"""
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        test_problem = """
        Problem: A car travels 60 miles in 2 hours. What is its average speed?
        """
        
        data = {
            "model": "deepseek-chat",
            "messages": [
                {"role": "user", "content": test_problem}
            ]
        }
        
        try:
            response = requests.post(self.api_url, headers=headers, json=data)
            self.assertEqual(response.status_code, 200)
            response_data = response.json()
            self.assertIn('choices', response_data)
            self.assertIn('content', response_data['choices'][0]['message'])
        except Exception as e:
            self.fail(f"Problem-solving test failed: {str(e)}")

if __name__ == '__main__':
    unittest.main() 