
from pydantic import BaseModel, EmailStr, ConfigDict


class LoginRequest(BaseModel):

    email: EmailStr

    password: str


class UserResponse(BaseModel):

    id: int

    name: str

    email: EmailStr

    role: str

    is_active: bool

    model_config = ConfigDict(
        from_attributes=True
    )


class TokenResponse(BaseModel):

    access_token: str

    token_type: str = "bearer"

    user: UserResponse
