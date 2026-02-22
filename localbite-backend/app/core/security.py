from datetime import datetime, timedelta
from typing import Optional, Union
from jose import JWTError, jwt
from passlib.context import CryptContext
from passlib.exc import MissingBackendError
import os
from dotenv import load_dotenv

load_dotenv()

# Secret key for JWT signing
SECRET_KEY = os.getenv("SECRET_KEY", "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

def _build_pwd_context() -> CryptContext:
    # Prefer argon2 when available, but fall back to bcrypt for local/dev setups
    # where argon2-cffi may not be installed in the active pyenv/venv.
    for scheme in ("argon2", "bcrypt", "pbkdf2_sha256"):
        ctx = CryptContext(schemes=[scheme], deprecated="auto")
        try:
            # Force backend initialization at import time so runtime registration/login
            # fails fast with a clear message instead of a deep stack trace.
            ctx.hash("localbite_backend_probe")
            if scheme != "argon2":
                print(f"⚠️  Argon2 backend unavailable; falling back to {scheme}.")
            return ctx
        except MissingBackendError:
            continue
        except Exception as exc:
            if scheme == "bcrypt":
                raise RuntimeError(
                    "No working password hashing backend available. "
                    "Install 'argon2-cffi' or use bcrypt<5 with passlib 1.7.4."
                ) from exc
            continue

    raise RuntimeError(
        "No password hashing backend available. Install 'argon2-cffi' or 'bcrypt<5'."
    )


pwd_context = _build_pwd_context()

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt
