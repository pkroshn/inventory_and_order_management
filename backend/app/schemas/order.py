from pydantic import BaseModel, Field, field_validator
from datetime import datetime
from typing import List
from app.schemas.order_item import OrderItemBase, OrderItemResponse
from app.models.order import OrderStatus


class OrderItemCreate(OrderItemBase):
    quantity: int = Field(..., gt=0)


class OrderCreate(BaseModel):
    items: List[OrderItemCreate] = Field(..., min_length=1)


# Map allowed strings to enum (API accepts "Pending", "Shipped", "Cancelled")
_STATUS_MAP = {s.value: s for s in OrderStatus}  # {"Pending": PENDING, ...}
_STATUS_MAP_LOWER = {k.lower(): v for k, v in _STATUS_MAP.items()}


class OrderStatusUpdate(BaseModel):
    status: OrderStatus

    @field_validator("status", mode="before")
    @classmethod
    def coerce_status(cls, v):
        if isinstance(v, OrderStatus):
            return v
        if isinstance(v, str):
            s = v.strip()
            if s in _STATUS_MAP:
                return _STATUS_MAP[s]
            if s.lower() in _STATUS_MAP_LOWER:
                return _STATUS_MAP_LOWER[s.lower()]
        raise ValueError(f"status must be one of: {list(_STATUS_MAP.keys())}")


class OrderResponse(BaseModel):
    id: int
    created_at: datetime
    status: OrderStatus
    order_items: List[OrderItemResponse]

    class Config:
        from_attributes = True
