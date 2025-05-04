from motor.motor_asyncio import AsyncIOMotorClient
from typing import List
from ..models.qa import CourseMaterial, Question, Answer
from ..config import MONGODB_URI, MONGODB_DB_NAME

client = AsyncIOMotorClient(MONGODB_URI)
db = client[MONGODB_DB_NAME]

async def save_course_material(material: CourseMaterial):
    """Save course material to MongoDB"""
    await db.course_materials.insert_one(material.dict())

async def get_course_materials(course_id: str, user_id: str) -> List[CourseMaterial]:
    """Get all course materials for a specific course and user"""
    cursor = db.course_materials.find({
        "course_id": course_id,
        "user_id": user_id
    })
    materials = []
    async for document in cursor:
        materials.append(CourseMaterial(**document))
    return materials

async def save_question_answer(qa: Answer):
    """Save question and answer to MongoDB"""
    await db.qa_history.insert_one(qa.dict())

async def get_user_qa_history(user_id: str) -> List[Answer]:
    """Get question and answer history for a user"""
    cursor = db.qa_history.find({"user_id": user_id})
    history = []
    async for document in cursor:
        history.append(Answer(**document))
    return history 