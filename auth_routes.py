import os
import jwt
import hashlib
import secrets
import logging
from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from database import db
from models import APIResponse

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Auth"])
security = HTTPBearer()

JWT_SECRET = os.getenv("JWT_SECRET", "hireflow-secret-key-change-in-prod")
JWT_ALGO = "HS256"
JWT_EXPIRE_HOURS = 72


def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    h = hashlib.sha256((salt + password).encode()).hexdigest()
    return f"{salt}${h}"


def verify_password(password: str, stored: str) -> bool:
    if "$" not in stored:
        return False
    salt, h = stored.split("$", 1)
    return hashlib.sha256((salt + password).encode()).hexdigest() == h


class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    role: str = "employee"


class LoginRequest(BaseModel):
    email: str
    password: str


def create_token(user_id: int, email: str, role: str) -> str:
    payload = {
        "sub": str(user_id),
        "email": email,
        "role": role,
        "exp": datetime.utcnow() + timedelta(hours=JWT_EXPIRE_HOURS),
        "iat": datetime.utcnow(),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGO)


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGO])
        user_id = int(payload["sub"])
        user = db.get_user_by_id(user_id)
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


@router.post("/auth/register")
def register(payload: RegisterRequest):
    existing = db.get_user_by_email(payload.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed = hash_password(payload.password)
    uid = db.create_user(payload.name, payload.email, hashed, payload.role)
    if not uid:
        raise HTTPException(status_code=500, detail="Failed to create user")

    token = create_token(uid, payload.email, payload.role)
    return APIResponse(success=True, data={
        "token": token,
        "user": {"id": uid, "name": payload.name, "email": payload.email, "role": payload.role},
    })


@router.post("/auth/login")
def login(payload: LoginRequest):
    user = db.get_user_by_email(payload.email)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not verify_password(payload.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_token(user.id, user.email, user.role)
    return APIResponse(success=True, data={
        "token": token,
        "user": {"id": user.id, "name": user.name, "email": user.email, "role": user.role},
    })


@router.get("/auth/me")
def me(user=Depends(get_current_user)):
    return APIResponse(success=True, data={
        "id": user.id, "name": user.name, "email": user.email, "role": user.role,
    })
