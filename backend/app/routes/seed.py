from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.seed_data import seed_database
from app.routes.auth import get_current_user
from app.models import User

router = APIRouter(prefix="/api/seed", tags=["seed"])

@router.post("/reset")
def reset_demo_data(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Resets database to pristine demo state with intentional anomalies for presentation."""
    seed_database(db=db, force=True)
    return {
        "status": "success",
        "message": "Demo data reset successfully. Pre-seeded anomalies restored for pitch presentation."
    }
