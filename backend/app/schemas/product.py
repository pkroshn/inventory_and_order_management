from pydantic import BaseModel, Field
from decimal import Decimal
from typing import Optional


class ProductCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    price: Decimal = Field(..., gt=0, decimal_places=2)
    stock_quantity: int = Field(..., ge=0)


class ProductResponse(BaseModel):
    id: int
    name: str
    price: Decimal
    stock_quantity: int

    class Config:
        from_attributes = True


class ProductListResponse(BaseModel):
    items: list[ProductResponse]
    total: int
    skip: int
    limit: int
