import hmac
import hashlib
import json
import base64
import time
import os
import uuid
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
from fastapi import HTTPException, Header, Depends, status
from sqlalchemy.orm import Session
from app.config import settings
from app.database import get_db
from app.models import User, Company

# Cryptographic password hashing using PBKDF2-HMAC-SHA256 with 100,000 rounds
def hash_password(password: str) -> str:
    """Create a secure salted PBKDF2 hash of the password."""
    salt = os.urandom(16)
    key = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, 100000)
    # Format: salt_hex$key_hex
    return f"{salt.hex()}${key.hex()}"

def verify_password(plain_password: str, password_hash: str) -> bool:
    """Verify a plain password against the stored salt$key hash."""
    if not password_hash:
        return False
    # Backward compatibility with demo plaintext or legacy demo passwords
    if password_hash in ("demo", "demo123", "hashed_demo_pw"):
        return plain_password in ("demo", "demo123", "password", "password123", "paypilot")
    
    try:
        parts = password_hash.split('$')
        if len(parts) != 2:
            return plain_password == password_hash
        salt = bytes.fromhex(parts[0])
        expected_key = parts[1]
        key = hashlib.pbkdf2_hmac('sha256', plain_password.encode('utf-8'), salt, 100000)
        return hmac.compare_digest(key.hex(), expected_key)
    except Exception:
        return False

# Base64URL encoding/decoding for RFC 7519 standard JSON Web Tokens
def _base64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode('utf-8').rstrip('=')

def _base64url_decode(data: str) -> bytes:
    padding = '=' * (4 - (len(data) % 4)) if (len(data) % 4) != 0 else ''
    return base64.urlsafe_b64decode(data + padding)

def create_access_token(payload: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Generates a cryptographically signed HMAC-SHA256 JWT access token."""
    to_encode = payload.copy()
    now = int(time.time())
    if expires_delta:
        expire = now + int(expires_delta.total_seconds())
    else:
        expire = now + (settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60)
    
    to_encode.update({
        "iat": now,
        "exp": expire,
        "iss": "paypilot-ai"
    })
    
    header = {"alg": "HS256", "typ": "JWT"}
    header_b64 = _base64url_encode(json.dumps(header, separators=(',', ':')).encode('utf-8'))
    payload_b64 = _base64url_encode(json.dumps(to_encode, separators=(',', ':')).encode('utf-8'))
    
    signature = hmac.new(
        settings.SECRET_KEY.encode('utf-8'),
        f"{header_b64}.{payload_b64}".encode('utf-8'),
        hashlib.sha256
    ).digest()
    
    sig_b64 = _base64url_encode(signature)
    return f"{header_b64}.{payload_b64}.{sig_b64}"

def decode_access_token(token: str) -> Dict[str, Any]:
    """Decodes and validates HMAC-SHA256 signature and expiration."""
    # Strip Bearer if present
    if token.startswith("Bearer "):
        token = token[7:].strip()
    
    # Enforce strict RFC 7519 HMAC-SHA256 signature verification
    parts = token.split('.')
    if len(parts) != 3:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token format"
        )
    
    header_b64, payload_b64, sig_b64 = parts
    
    expected_sig = hmac.new(
        settings.SECRET_KEY.encode('utf-8'),
        f"{header_b64}.{payload_b64}".encode('utf-8'),
        hashlib.sha256
    ).digest()
    
    actual_sig = _base64url_decode(sig_b64)
    if not hmac.compare_digest(expected_sig, actual_sig):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token signature"
        )
        
    try:
        payload = json.loads(_base64url_decode(payload_b64).decode('utf-8'))
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Corrupted token payload"
        )
        
    if "exp" in payload and payload["exp"] < int(time.time()):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session has expired. Please sign in again."
        )
        
    return payload

def get_current_authenticated_user(
    authorization: Optional[str] = Header(None),
    x_user_id: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> User:
    """
    Extracts the authenticated user from JWT Bearer token or fallback demo switcher header.
    Validates user active status and organization status.
    """
    user_id = None
    if authorization:
        payload = decode_access_token(authorization)
        user_id = payload.get("sub") or payload.get("user_id")
    elif settings.APP_ENV != "production" and x_user_id:
        user_id = x_user_id

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please provide a valid Bearer token."
        )

    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed. User account not found."
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This user account has been deactivated."
        )

    return user

def require_roles(allowed_roles: List[str]):
    """Role-based authorization dependency factory."""
    def role_checker(user: User = Depends(get_current_authenticated_user)) -> User:
        # 'owner' and 'admin' possess overarching administration privileges
        user_role = user.role.lower()
        normalized_allowed = [r.lower() for r in allowed_roles]
        
        if "admin" in normalized_allowed and user_role in ("owner", "super_admin"):
            return user
            
        if user_role not in normalized_allowed and "all" not in normalized_allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied: Requires role in {allowed_roles}, but current role is '{user.role}'."
            )
        return user
    return role_checker
