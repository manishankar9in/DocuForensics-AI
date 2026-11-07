import re
from pydantic import BaseModel, Field, field_validator


class Credentials(BaseModel):
    email: str = Field(min_length=3, max_length=254)
    password: str = Field(min_length=1, max_length=128)

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        value = value.strip().lower()
        if not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", value):
            raise ValueError("Enter a valid email address.")
        return value


class SignUpRequest(Credentials):
    password: str = Field(min_length=12, max_length=128)


class UserResponse(BaseModel):
    id: str
    email: str
    created_at: str
