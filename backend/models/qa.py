from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class User(BaseModel):
    uid: str
    email: str
    display_name: Optional[str] = None
    photo_url: Optional[str] = None

class Question(BaseModel):
    text: str
    course_id: Optional[str] = None

class Answer(BaseModel):
    question: str
    solution: str
    user_id: str
    course_id: Optional[str] = None
    created_at: datetime = datetime.utcnow()

class CourseMaterial(BaseModel):
    filename: str
    content: str
    course_id: Optional[str]
    user_id: str
    created_at: datetime = datetime.utcnow() 