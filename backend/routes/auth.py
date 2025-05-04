from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer
from typing import Optional
from ..services.firebase import verify_token
from ..models.qa import User

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

async def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    try:
        decoded_token = verify_token(token)
        return User(
            uid=decoded_token["uid"],
            email=decoded_token["email"]
        )
    except Exception as e:
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

@router.post("/verify-token")
async def verify_auth_token(token: str):
    try:
        decoded_token = verify_token(token)
        return {"valid": True, "uid": decoded_token["uid"]}
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid token") 