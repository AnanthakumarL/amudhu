from __future__ import annotations

from typing import Any

import stripe
from fastapi import APIRouter, Depends, Header, Request, status
from pydantic import BaseModel, Field

from app.core.config import get_settings
from app.core.exceptions import NotFoundException
from app.db.mongo_client import get_mongo_db
from app.models.order import Order, OrderCreate, OrderItem, OrderStatus, OrderUpdate
from app.services.order_service import OrderService
from app.services.product_service import ProductService


router = APIRouter()


def get_order_service(db=Depends(get_mongo_db)) -> OrderService:
    return OrderService(db)


def get_product_service(db=Depends(get_mongo_db)) -> ProductService:
    return ProductService(db)


class CheckoutCartItem(BaseModel):
    product_id: str = Field(..., min_length=1)
    quantity: int = Field(..., gt=0)


class CreateCheckoutSessionRequest(BaseModel):
    customer_name: str = Field(..., min_length=1, max_length=200)
    customer_identifier: str = Field(..., min_length=1, max_length=200)
    customer_email: str | None = None
    customer_phone: str | None = None
    shipping_address: str = Field(..., min_length=1)
    billing_address: str | None = None
    items: list[CheckoutCartItem] = Field(..., min_length=1)


class CreateCheckoutSessionResponse(BaseModel):
    order: Order
    session_id: str


def _paise_from_rupees(value: float) -> int:
    # Stripe expects the smallest currency unit for unit_amount (e.g., paise for INR)
    return int(round(float(value) * 100))


@router.post(
    "/create-checkout-session",
    response_model=CreateCheckoutSessionResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_checkout_session(
    body: CreateCheckoutSessionRequest,
    order_service: OrderService = Depends(get_order_service),
    product_service: ProductService = Depends(get_product_service),
):
    settings = get_settings()
    if not settings.STRIPE_SECRET_KEY:
        raise RuntimeError("STRIPE_SECRET_KEY is not configured")

    stripe.api_key = settings.STRIPE_SECRET_KEY

    # Validate items against products stored in MongoDB (prevents client-side price tampering)
    order_items: list[OrderItem] = []
    stripe_line_items: list[dict[str, Any]] = []

    for cart_item in body.items:
        product = product_service.get_product(cart_item.product_id)
        quantity = int(cart_item.quantity)
        unit_price = float(product.price)

        order_item = OrderItem(
            product_id=str(product.id),
            product_name=str(product.name),
            quantity=quantity,
            price=unit_price,
            subtotal=unit_price * quantity,
        )
        order_items.append(order_item)

        stripe_line_items.append(
            {
                "price_data": {
                    "currency": settings.STRIPE_CURRENCY,
                    "unit_amount": _paise_from_rupees(unit_price),
                    "product_data": {
                        "name": str(product.name),
                    },
                },
                "quantity": quantity,
            }
        )

    subtotal = sum(it.subtotal for it in order_items)
    total = subtotal

    order_payload = OrderCreate(
        customer_name=body.customer_name,
        customer_identifier=body.customer_identifier,
        customer_email=body.customer_email,
        customer_phone=body.customer_phone,
        shipping_address=body.shipping_address,
        billing_address=body.billing_address,
        items=order_items,
        subtotal=subtotal,
        tax=0,
        shipping_cost=0,
        total=total,
        status=OrderStatus.PENDING,
        notes="payment_method=stripe; payment_status=pending",
    )

    order = order_service.create_order(order_payload)

    success_url = f"{settings.CLIENT_URL}/#/orders?checkout=success&order_id={order.id}"
    cancel_url = f"{settings.CLIENT_URL}/#/checkout?checkout=cancelled&order_id={order.id}"

    session = stripe.checkout.Session.create(
        mode="payment",
        line_items=stripe_line_items,
        success_url=success_url,
        cancel_url=cancel_url,
        client_reference_id=order.id,
        customer_email=body.customer_email or None,
        metadata={
            "order_id": order.id,
            "order_number": order.order_number,
            "customer_identifier": body.customer_identifier,
        },
    )

    # Persist Stripe session id on the order (in notes to avoid schema changes)
    order = order_service.update_order(
        order.id,
        OrderUpdate(notes=f"payment_method=stripe; payment_status=pending; stripe_session_id={session.id}"),
    )

    return CreateCheckoutSessionResponse(order=order, session_id=session.id)


@router.post("/webhook")
async def stripe_webhook(
    request: Request,
    stripe_signature: str | None = Header(default=None, alias="stripe-signature"),
    order_service: OrderService = Depends(get_order_service),
):
    settings = get_settings()
    if not settings.STRIPE_SECRET_KEY:
        raise RuntimeError("STRIPE_SECRET_KEY is not configured")
    if not settings.STRIPE_WEBHOOK_SECRET:
        raise RuntimeError("STRIPE_WEBHOOK_SECRET is not configured")

    stripe.api_key = settings.STRIPE_SECRET_KEY

    payload = await request.body()
    try:
        event = stripe.Webhook.construct_event(
            payload=payload,
            sig_header=stripe_signature,
            secret=settings.STRIPE_WEBHOOK_SECRET,
        )
    except Exception as e:
        return {"ok": False, "error": str(e)}

    event_type = event.get("type")
    if event_type == "checkout.session.completed":
        session = event["data"]["object"]
        order_id = None
        metadata = session.get("metadata") or {}
        if isinstance(metadata, dict):
            order_id = metadata.get("order_id")
        if not order_id:
            order_id = session.get("client_reference_id")

        if order_id:
            payment_intent = session.get("payment_intent")
            notes = "payment_method=stripe; payment_status=paid"
            if payment_intent:
                notes += f"; stripe_payment_intent={payment_intent}"

            try:
                order_service.update_order(
                    order_id,
                    OrderUpdate(notes=notes, status=OrderStatus.PENDING),
                )
            except NotFoundException:
                pass

    return {"ok": True}
