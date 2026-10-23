import pytest
import hmac
import hashlib
from fastapi import HTTPException
from app.config import settings
from app.routes.billing import get_plans, SAAS_PLANS, verify_payment, VerifyPaymentRequest
from app.models import Company, User, PaymentTransaction
from app.database import SessionLocal

def test_saas_pricing_matrix():
    """Verify that all standard SaaS plans have defined features, limits, and INR pricing."""
    res = get_plans()
    plans = res["plans"]
    assert len(plans) == 4
    
    plan_ids = [p["id"] for p in plans]
    assert "free_trial" in plan_ids
    assert "starter" in plan_ids
    assert "growth" in plan_ids
    assert "enterprise" in plan_ids
    
    starter = next(p for p in plans if p["id"] == "starter")
    assert starter["max_employees"] == 25
    assert starter["monthly_price"] == 1999

    growth = next(p for p in plans if p["id"] == "growth")
    assert growth["max_employees"] == 100
    assert growth["monthly_price"] == 4999

def test_razorpay_signature_rejection_on_invalid_hmac():
    """Verify that verify_payment strictly rejects invalid or fabricated payment signatures."""
    db = SessionLocal()
    try:
        user = User(id="test_admin_user", company_id="comp_ind_001", role="owner", email="test@corp.com")
        
        # Test with altered secret and bad signature
        req = VerifyPaymentRequest(
            razorpay_order_id="order_valid_123",
            razorpay_payment_id="pay_valid_456",
            razorpay_signature="invalid_fabricated_hex_signature",
            plan_tier="growth",
            billing_cycle="monthly"
        )
        
        # When secret is non-demo or invalid, it must raise 400
        original_secret = settings.RAZORPAY_KEY_SECRET
        settings.RAZORPAY_KEY_SECRET = "production_super_secret_key"
        try:
            with pytest.raises(HTTPException) as excinfo:
                verify_payment(req=req, user=user, db=db)
            assert excinfo.value.status_code == 400
            assert "verification failed" in excinfo.value.detail.lower()
        finally:
            settings.RAZORPAY_KEY_SECRET = original_secret
    finally:
        db.close()
