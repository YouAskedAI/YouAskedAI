from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from typing import List
from ..services.course_service import CourseService
from ..services.firebase import verify_token
from ..models.course import CourseCreate, ProblemSolve

router = APIRouter()

@router.post("/create")
async def create_course(
    course: CourseCreate,
    current_user: dict = Depends(verify_token)
):
    """Create a new course folder"""
    return await CourseService.create_course_folder(
        current_user['uid'],
        course.name
    )

@router.post("/{course_name}/upload")
async def upload_file(
    course_name: str,
    file: UploadFile = File(...),
    current_user: dict = Depends(verify_token)
):
    """Upload a file to a course folder"""
    return await CourseService.upload_file(
        current_user['uid'],
        course_name,
        file,
        file.filename
    )

@router.get("/{course_name}/files")
async def get_files(
    course_name: str,
    current_user: dict = Depends(verify_token)
):
    """Get all files in a course folder"""
    return await CourseService.get_course_files(
        current_user['uid'],
        course_name
    )

@router.post("/{course_name}/solve")
async def solve_problem(
    course_name: str,
    problem: ProblemSolve,
    current_user: dict = Depends(verify_token)
):
    """Solve a problem using course materials"""
    return await CourseService.solve_problem(
        current_user['uid'],
        course_name,
        problem.text
    )

@router.delete("/{course_name}/files/{filename}")
async def delete_file(
    course_name: str,
    filename: str,
    current_user: dict = Depends(verify_token)
):
    """Delete a file from a course folder"""
    return await CourseService.delete_file(
        current_user['uid'],
        course_name,
        filename
    ) 