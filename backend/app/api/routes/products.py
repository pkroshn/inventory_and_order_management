from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List
from app.api.dependencies import get_database_session
from app.services.product_service import ProductService
from app.schemas.product import ProductCreate, ProductResponse, ProductListResponse

router = APIRouter()


@router.post("/", response_model=ProductResponse, status_code=201)
def create_product(
    product_data: ProductCreate,
    db: Session = Depends(get_database_session)
):
    """Create a new product"""
    product = ProductService.create_product(db, product_data)
    return product


@router.get("/", response_model=ProductListResponse)
def list_products(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_database_session)
):
    """List products with pagination"""
    products, total = ProductService.list_products(db, skip=skip, limit=limit)
    return ProductListResponse(
        items=[ProductResponse.model_validate(p) for p in products],
        total=total,
        skip=skip,
        limit=limit
    )
