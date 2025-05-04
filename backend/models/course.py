from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class CourseCreate(BaseModel):
    name: str

class ProblemSolve(BaseModel):
    text: str

class CourseFile(BaseModel):
    filename: str
    content_type: str
    size: int
    text_content: Optional[str] = None
    created_at: datetime
    updated_at: datetime

class Course(BaseModel):
    name: str
    created_at: datetime
    updated_at: datetime
    files: list[CourseFile] = [] 