from pydantic import BaseModel, ConfigDict
from typing import Optional


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user: "UserResponse"


class LoginRequest(BaseModel):
    username: str
    password: str


class UserResponse(BaseModel):
    id: str
    username: str
    full_name: str
    role: str
    is_active: bool

    model_config = ConfigDict(from_attributes=True)


TokenResponse.model_rebuild()
