from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.postgres import get_db, get_sync_db
from app.deps import get_current_user
from app.models.user import User
from app.seed.seed_data import seed_database
from app.core.audit import write_audit_log

router = APIRouter(prefix="/seed", tags=["Seed & Demo Data"])


@router.post("/load-demo-data")
async def load_demo_data(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role != "administrator":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin role required to trigger database seeding.",
        )
    
    sync_db = get_sync_db()
    try:
        seed_database(sync_db)
    finally:
        sync_db.close()

    await write_audit_log(
        db=db,
        action="seed_data",
        user_id=current_user.id,
        target_type="database",
        target_id="demo_fixtures",
        metadata={"triggered_by": current_user.username},
    )
    await db.commit()

    return {
        "status": "success",
        "message": "Fictional demo dataset loaded successfully and graph synchronized.",
        "is_synthetic": True,
        "disclaimer": "Decision-support only. Not a determination of guilt or risk. All findings require human investigator review.",
    }
