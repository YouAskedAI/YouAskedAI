import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# API Keys and Secrets
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")
DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions"

# Database Configuration
MONGODB_URI = os.getenv("MONGODB_URI")
MONGODB_DB_NAME = "youaskedai"

# Firebase Configuration
FIREBASE_CREDENTIALS = os.getenv("FIREBASE_CREDENTIALS")

# Application Settings
APP_NAME = "YouAskedAI"
APP_VERSION = "1.0.0"
DEBUG = os.getenv("DEBUG", "False").lower() == "true"

# Payment Settings
STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY")
STRIPE_PUBLISHABLE_KEY = os.getenv("STRIPE_PUBLISHABLE_KEY")
SUBSCRIPTION_PRICE = 9.99  # Monthly subscription price in USD 