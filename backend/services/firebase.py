import firebase_admin
from firebase_admin import auth, credentials
from ..config import FIREBASE_CREDENTIALS

# Initialize Firebase Admin
cred = credentials.Certificate(FIREBASE_CREDENTIALS)
firebase_admin.initialize_app(cred)

def verify_token(token: str) -> dict:
    """
    Verify a Firebase ID token
    Returns the decoded token if valid
    """
    try:
        decoded_token = auth.verify_id_token(token)
        return decoded_token
    except Exception as e:
        raise Exception(f"Invalid token: {str(e)}")

async def get_user(uid: str) -> dict:
    """
    Get user information from Firebase
    """
    try:
        user = auth.get_user(uid)
        return {
            "uid": user.uid,
            "email": user.email,
            "display_name": user.display_name,
            "photo_url": user.photo_url
        }
    except Exception as e:
        raise Exception(f"Error getting user: {str(e)}") 