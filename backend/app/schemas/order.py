from pydantic import BaseModel, Field
from datetime import datetime
from typing import List
from app.schemas.order_item import OrderItemBase, OrderItemResponse
from app.models.order import OrderStatus


class OrderItemCreate(OrderItemBase):
    quantity: int = Field(..., gt=0)


class OrderCreate(BaseModel):
    items: List[OrderItemCreate] = Field(..., min_length=1)


class OrderStatusUpdate(BaseModel):
    status: OrderStatus


class OrderResponse(BaseModel):
    id: int
    created_at: datetime
    status: OrderStatus
    order_items: List[OrderItemResponse]

    class Config:
        from_attributes = True
