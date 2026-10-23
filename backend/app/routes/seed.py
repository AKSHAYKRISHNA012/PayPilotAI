from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.seed_data import seed_database
from app.security import require_roles
from app.config import settings
from app.models import User

router = APIRouter(prefix="/api/seed", tags=["seed"])

@router.post("/reset")
def reset_demo_data(
    user: User = Depends(require_roles(["owner", "admin"])),
    db: Session = Depends(get_db)
):
    """Resets database to pristine demo state with intentional anomalies for presentation."""
    if settings.APP_ENV == "production":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Database reset is permanently disabled in production environments."
        )

    seed_database(db=db, force=True)
    return {
        "status": "success",
        "message": "Demo data reset successfully. Pre-seeded anomalies restored for pitch presentation."
    }
