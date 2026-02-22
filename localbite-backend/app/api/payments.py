from uuid import UUID, uuid4
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from app.crud import payments as payments_crud
from app.database import get_db
from app.schemas.payments import PaymentCreate, PaymentOut, PaymentUpdate
import os

router = APIRouter(prefix="/payments", tags=["payments"])

# Mock Stripe sessions store (in production, use a proper database)
MOCK_STRIPE_SESSIONS = {}

class StripeCheckoutRequest(BaseModel):
    payment_id: str  # Accept as string, will be stored as reference
    order_id: str    # Accept as string (integer from orders table)
    amount: int


@router.post("/stripe/checkout", status_code=status.HTTP_201_CREATED)
def create_stripe_checkout(
    payload: StripeCheckoutRequest
):
    """
    Create a mock Stripe checkout session.
    This generates a session for the mock Stripe payment page.
    """
    try:
        # Generate mock session ID
        session_id = f"cs_test_{uuid4().hex[:20]}"
        
        # Store session info temporarily for the mock checkout
        MOCK_STRIPE_SESSIONS[session_id] = {
            "payment_id": payload.payment_id,
            "order_id": payload.order_id,
            "amount": payload.amount,
            "status": "pending"
        }
        
        # Return session data for frontend redirect
        return {
            "session_id": session_id,
            "charge_id": f"ch_test_{uuid4().hex[:20]}",
            "url": f"http://localhost:8000/api/v1/payments/stripe/mock-checkout?session_id={session_id}"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/stripe/mock-checkout")
def mock_stripe_checkout(session_id: str):
    """
    Mock Stripe checkout page that redirects to success/cancel.
    """
    if session_id not in MOCK_STRIPE_SESSIONS:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session_data = MOCK_STRIPE_SESSIONS[session_id]
    amount = session_data["amount"]
    
    # Return HTML with redirect options (simulating Stripe checkout)
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Mock Stripe Payment</title>
        <style>
            body {{
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                margin: 0;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }}
            .card {{
                background: white;
                border-radius: 12px;
                padding: 40px;
                max-width: 400px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.2);
                text-align: center;
            }}
            h1 {{
                color: #333;
                margin-bottom: 10px;
            }}
            .amount {{
                font-size: 36px;
                font-weight: bold;
                color: #667eea;
                margin: 20px 0;
            }}
            .buttons {{
                display: flex;
                gap: 12px;
                margin-top: 30px;
            }}
            button {{
                flex: 1;
                padding: 12px 24px;
                border: none;
                border-radius: 8px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s;
            }}
            .btn-success {{
                background: #10b981;
                color: white;
            }}
            .btn-success:hover {{
                background: #059669;
            }}
            .btn-cancel {{
                background: #ef4444;
                color: white;
            }}
            .btn-cancel:hover {{
                background: #dc2626;
            }}
            .info {{
                background: #f3f4f6;
                padding: 12px;
                border-radius: 8px;
                margin-top: 20px;
                font-size: 14px;
                color: #666;
            }}
        </style>
    </head>
    <body>
        <div class="card">
            <h1>🔒 Mock Stripe Payment</h1>
            <div class="amount">${amount / 100:.2f}</div>
            <p>Test Card: 4242 4242 4242 4242</p>
            <div class="buttons">
                <form action="http://localhost:3000/dashboard/customer/payment/success?session_id={session_id}" method="get" style="flex: 1;">
                    <button type="submit" class="btn-success" style="width: 100%;">✓ Pay Successfully</button>
                </form>
                <form action="http://localhost:3000/dashboard/customer/payment/cancel?session_id={session_id}" method="get" style="flex: 1;">
                    <button type="submit" class="btn-cancel" style="width: 100%;">✕ Cancel Payment</button>
                </form>
            </div>
            <div class="info">
                This is a mock payment page. Your payment will be processed immediately.
            </div>
        </div>
        <script>
            // Store session data for callback
            sessionStorage.setItem('mock_session', '{session_id}');
        </script>
    </body>
    </html>
    """
    
    return HTMLResponse(content=html_content)


@router.post("/stripe/confirm")
def confirm_stripe_payment(session_id: str, payment_id: str, db: Session = Depends(get_db)):
    """
    Confirm a mock Stripe payment and update payment status.
    Called after successful mock stripe checkout.
    """
    if session_id not in MOCK_STRIPE_SESSIONS:
        raise HTTPException(status_code=404, detail="Session not found")
    
    try:
        # Try to get and update payment if it exists
        # For now, just mark the session as completed
        MOCK_STRIPE_SESSIONS[session_id]["status"] = "completed"
        
        return {"status": "success", "message": "Payment confirmed"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/", response_model=PaymentOut, status_code=status.HTTP_201_CREATED)
def create_payment(payload: PaymentCreate, db: Session = Depends(get_db)):
    try:
        return payments_crud.create(db, payload)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="Failed to create payment. Idempotency key may already exist",
        )


@router.get("/", response_model=list[PaymentOut])
def list_payments(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=1000),
    db: Session = Depends(get_db),
):
    return payments_crud.list_all(db, skip=skip, limit=limit)


@router.get("/{payment_id}", response_model=PaymentOut)
def get_payment(payment_id: UUID, db: Session = Depends(get_db)):
    db_obj = payments_crud.get_by_id(db, payment_id)
    if not db_obj:
        raise HTTPException(status_code=404, detail="Payment not found")
    return db_obj


@router.put("/{payment_id}", response_model=PaymentOut)
def update_payment(
    payment_id: UUID, payload: PaymentUpdate, db: Session = Depends(get_db)
):
    db_obj = payments_crud.get_by_id(db, payment_id)
    if not db_obj:
        raise HTTPException(status_code=404, detail="Payment not found")
    try:
        return payments_crud.update(db, db_obj, payload)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Failed to update payment")


@router.delete("/{payment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_payment(payment_id: UUID, db: Session = Depends(get_db)):
    db_obj = payments_crud.get_by_id(db, payment_id)
    if not db_obj:
        raise HTTPException(status_code=404, detail="Payment not found")
    payments_crud.delete(db, db_obj)
    return None
