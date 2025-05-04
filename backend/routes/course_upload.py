from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from ..services.ocr import extract_text_from_file
from ..services.deepseek import solve_problem_from_context
from ..services.mongo import save_course_material, get_course_materials
from ..models.qa import CourseMaterial, Question, Answer
from ..routes.auth import get_current_user

router = APIRouter()

@router.post("/upload")
async def upload_course_material(
    file: UploadFile = File(...),
    course_id: str = None,
    current_user: dict = Depends(get_current_user)
):
    try:
        # Extract text from file
        text_content = await extract_text_from_file(file)
        
        # Save to MongoDB
        material = CourseMaterial(
            filename=file.filename,
            content=text_content,
            course_id=course_id,
            user_id=current_user.uid
        )
        await save_course_material(material)
        
        return {"message": "File uploaded and processed successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/solve-from-course")
async def solve_from_course(
    question: Question,
    course_id: str,
    current_user: dict = Depends(get_current_user)
) -> Answer:
    try:
        # Get relevant course materials
        materials = await get_course_materials(course_id, current_user.uid)
        context = "\n".join([m.content for m in materials])
        
        # Solve problem using context
        solution = await solve_problem_from_context(question.text, context)
        
        return Answer(
            question=question.text,
            solution=solution,
            user_id=current_user.uid,
            course_id=course_id
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 