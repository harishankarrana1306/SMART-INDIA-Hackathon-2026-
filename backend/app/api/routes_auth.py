from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.postgres import get_db
from app.models.user import User
from app.core.security import verify_password, create_access_token
from app.core.audit import write_audit_log
from app.deps import get_current_user
from app.schemas.auth import LoginRequest, TokenResponse, UserResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=TokenResponse)
async def login(
    payload: LoginRequest,
    db: AsyncSession = Depends(get_db),
):
    query = select(User).where(User.username == payload.username)
    result = await db.execute(query)
    user = result.scalar_one_or_none()

    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive",
        )

    # Generate JWT
    token = create_access_token(
        subject=user.id,
        role=user.role,
        username=user.username,
        full_name=user.full_name,
    )

    # Write tamper-evident audit record
    await write_audit_log(
        db=db,
        action="login",
        user_id=user.id,
        target_type="user",
        target_id=user.id,
        metadata={"username": user.username, "role": user.role},
    )
    await db.commit()

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        role=user.role,
        user=UserResponse.model_validate(user),
    )


@router.get("/me", response_model=UserResponse)
async def get_my_profile(
    current_user: User = Depends(get_current_user),
):
    return UserResponse.model_validate(current_user)
