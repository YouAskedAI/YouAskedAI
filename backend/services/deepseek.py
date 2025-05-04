import os
import requests
from typing import Optional
from ..config import DEEPSEEK_API_KEY, DEEPSEEK_API_URL

async def solve_problem(question: str) -> str:
    """
    Solve a problem using the DeepSeek API
    """
    try:
        headers = {
            "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
            "Content-Type": "application/json"
        }
        
        data = {
            "model": "deepseek-chat",
            "messages": [
                {
                    "role": "system",
                    "content": "You are a helpful AI tutor that solves academic problems step by step."
                },
                {
                    "role": "user",
                    "content": question
                }
            ]
        }
        
        response = requests.post(DEEPSEEK_API_URL, headers=headers, json=data)
        response.raise_for_status()
        
        return response.json()["choices"][0]["message"]["content"]
    except Exception as e:
        raise Exception(f"Error calling DeepSeek API: {str(e)}")

async def solve_problem_from_context(question: str, context: str) -> str:
    """
    Solve a problem using the DeepSeek API with additional context
    """
    try:
        headers = {
            "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
            "Content-Type": "application/json"
        }
        
        data = {
            "model": "deepseek-chat",
            "messages": [
                {
                    "role": "system",
                    "content": "You are a helpful AI tutor that solves academic problems step by step using the provided context."
                },
                {
                    "role": "user",
                    "content": f"Context: {context}\n\nQuestion: {question}"
                }
            ]
        }
        
        response = requests.post(DEEPSEEK_API_URL, headers=headers, json=data)
        response.raise_for_status()
        
        return response.json()["choices"][0]["message"]["content"]
    except Exception as e:
        raise Exception(f"Error calling DeepSeek API: {str(e)}") 