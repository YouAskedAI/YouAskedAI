from fastapi import APIRouter, HTTPException, Depends
from ..services.deepseek import solve_problem
from ..models.qa import Question, Answer
from ..routes.auth import get_current_user

router = APIRouter()

@router.post("/solve")
async def solve_question(question: Question, current_user: dict = Depends(get_current_user)) -> Answer:
    try:
        solution = await solve_problem(question.text)
        return Answer(
            question=question.text,
            solution=solution,
            user_id=current_user.uid
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 