from typing import List
from fastapi import HTTPException, status
from app.models.user import User


class RoleChecker:
    def __init__(self, allowed_roles: List[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, user: User) -> User:
        if user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access forbidden: User role '{user.role}' is not in allowed roles {self.allowed_roles}."
            )
        return user


def require_role(allowed_roles: List[str]):
    return RoleChecker(allowed_roles)
