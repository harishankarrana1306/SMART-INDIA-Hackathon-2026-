from fastapi import APIRouter, Depends
from app.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/brief", tags=["Investigation Briefs (Phase 3 Stub)"])


@router.post("/generate")
async def generate_brief(current_user: User = Depends(get_current_user)):
    return {
        "status": "Phase 3 Feature: Automated executive brief generation pending Phase 3 activation",
        "brief_id": "brief-phase3-stub",
        "disclaimer": "Decision-support only. Not a determination of guilt or risk. All findings require human investigator review.",
    }


@router.get("/{brief_id}/pdf")
async def export_brief_pdf(brief_id: str, current_user: User = Depends(get_current_user)):
    return {
        "status": "Phase 3 Feature: PDF export pending Phase 3 activation",
        "disclaimer": "Decision-support only. Not a determination of guilt or risk. All findings require human investigator review.",
    }
