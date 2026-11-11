from pydantic import BaseModel, Field, field_validator

from app.schemas.user import UserProfileResponse


class LoginRequest(BaseModel):
    usuario: str = Field(min_length=1, max_length=100)
    password: str = Field(min_length=1, max_length=128)
    remember_me: bool = False

    @field_validator("usuario")
    @classmethod
    def username_must_not_be_blank(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("El usuario es obligatorio.")
        return value


class RegisterRequest(BaseModel):
    nombre: str = Field(min_length=1, max_length=150)
    usuario: str = Field(min_length=3, max_length=100)
    password: str = Field(min_length=8, max_length=128)

    @field_validator("nombre", "usuario")
    @classmethod
    def registration_text_must_not_be_blank(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Este campo es obligatorio.")
        return value


class LoginResponse(BaseModel):
    user: UserProfileResponse


class MessageResponse(BaseModel):
    message: str
