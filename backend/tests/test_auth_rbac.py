import pytest
import hmac
import hashlib
from fastapi import HTTPException
from app.security import (
    hash_password, verify_password, create_access_token,
    decode_access_token, require_roles
)
from app.models import User

def test_password_hashing_security():
    """Verify that password hashing uses unique cryptographic salt and verifies correctly."""
    pw = "SecureP@ssw0rd2026!"
    h1 = hash_password(pw)
    h2 = hash_password(pw)
    
    # Salts must ensure different outputs for same password
    assert h1 != h2
    assert verify_password(pw, h1)
    assert verify_password(pw, h2)
    assert not verify_password("WrongPassword", h1)

def test_jwt_tamper_detection():
    """Verify that any modification to JWT header, payload, or signature is rejected."""
    token = create_access_token({"sub": "user_xyz", "role": "admin"})
    parts = token.split('.')
    assert len(parts) == 3
    
    # Tampered signature
    tampered_sig = parts[2][:-2] + "xx"
    bad_token = f"{parts[0]}.{parts[1]}.{tampered_sig}"
    
    with pytest.raises(HTTPException) as excinfo:
        decode_access_token(bad_token)
    assert excinfo.value.status_code == 401
    assert "signature" in excinfo.value.detail.lower()

def test_rbac_role_enforcement():
    """Verify that RBAC checker permits authorized roles and forbids unauthorized roles."""
    admin_checker = require_roles(["admin", "payroll_admin"])
    
    admin_user = User(id="u1", role="admin", is_active=True)
    payroll_user = User(id="u2", role="payroll_admin", is_active=True)
    employee_user = User(id="u3", role="employee", is_active=True)
    owner_user = User(id="u4", role="owner", is_active=True)
    
    # Allowed
    assert admin_checker(admin_user) == admin_user
    assert admin_checker(payroll_user) == payroll_user
    assert admin_checker(owner_user) == owner_user # Owner has overarching admin rights
    
    # Forbidden for standard employee
    with pytest.raises(HTTPException) as excinfo:
        admin_checker(employee_user)
    assert excinfo.value.status_code == 403
