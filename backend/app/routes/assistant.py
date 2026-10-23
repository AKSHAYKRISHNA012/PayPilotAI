from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User
from app.routes.auth import get_current_user
from app.assistant import process_assistant_query

router = APIRouter(prefix="/api/assistant", tags=["assistant"])

class ChatRequest(BaseModel):
    query: str

@router.post("/chat")
def chat_with_assistant(
    req: ChatRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not req.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")

    response = process_assistant_query(
        db=db,
        company_id=user.company_id,
        user=user,
        query=req.query
    )
    return response
