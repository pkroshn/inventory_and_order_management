from pydantic import BaseModel
from decimal import Decimal


class OrderItemBase(BaseModel):
    product_id: int
    quantity: int


class OrderItemResponse(BaseModel):
    id: int
    product_id: int
    quantity_ordered: int
    price_at_time: Decimal
    product_name: str | None = None

    class Config:
        from_attributes = True
