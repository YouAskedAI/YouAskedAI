from fastapi import APIRouter, HTTPException, Depends
from ..services.firebase import verify_token
from ..config import STRIPE_SECRET_KEY
import stripe
from typing import Optional

router = APIRouter()
stripe.api_key = STRIPE_SECRET_KEY

async def get_current_user(token: str = Depends(verify_token)):
    return token

@router.post("/create")
async def create_subscription(
    payment_method_id: str,
    email: str,
    user_id: str,
    current_user: dict = Depends(get_current_user)
):
    try:
        # Create or get customer
        customers = stripe.Customer.list(email=email)
        if customers.data:
            customer = customers.data[0]
        else:
            customer = stripe.Customer.create(
                email=email,
                payment_method=payment_method_id,
                invoice_settings={
                    'default_payment_method': payment_method_id
                }
            )

        # Create subscription
        subscription = stripe.Subscription.create(
            customer=customer.id,
            items=[{
                'price': 'price_H5ggYwtDq4fbrJ'  # Replace with your Stripe price ID
            }],
            expand=['latest_invoice.payment_intent']
        )

        return {
            "subscriptionId": subscription.id,
            "status": subscription.status,
            "customerId": customer.id
        }
    except stripe.error.CardError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/status/{subscription_id}")
async def get_subscription_status(
    subscription_id: str,
    current_user: dict = Depends(get_current_user)
):
    try:
        subscription = stripe.Subscription.retrieve(subscription_id)
        return {
            "status": subscription.status,
            "current_period_end": subscription.current_period_end
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/cancel/{subscription_id}")
async def cancel_subscription(
    subscription_id: str,
    current_user: dict = Depends(get_current_user)
):
    try:
        subscription = stripe.Subscription.delete(subscription_id)
        return {
            "status": subscription.status,
            "canceled_at": subscription.canceled_at
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 