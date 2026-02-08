from fastapi import APIRouter, Depends, Query, HTTPException, status, Body
from sqlalchemy.orm import Session
from typing import List
from app.api.dependencies import get_database_session
from app.services.product_service import ProductService
from app.schemas.product import ProductCreate, ProductUpdate, ProductResponse, ProductListResponse

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


@router.get("/{product_id}/", response_model=ProductResponse)
def get_product(
    product_id: int,
    db: Session = Depends(get_database_session)
):
    """Get a single product by ID"""
    product = ProductService.get_product(db, product_id)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return product


@router.patch("/{product_id}/", response_model=ProductResponse)
def update_product(
    product_id: int,
    product_data: ProductUpdate,
    db: Session = Depends(get_database_session)
):
    """Update a product by ID"""
    product = ProductService.update_product(db, product_id, product_data)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return product


@router.delete("/{product_id}/", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    product_id: int,
    db: Session = Depends(get_database_session)
):
    """Delete a single product"""
    if not ProductService.delete_product(db, product_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")


@router.post("/bulk-delete/", status_code=status.HTTP_200_OK)
def bulk_delete_products(
    product_ids: List[int] = Body(..., embed=False),
    db: Session = Depends(get_database_session)
):
    """Delete multiple products by ID. Request body: JSON array of product IDs, e.g. [1, 2, 3]."""
    deleted = ProductService.delete_products_bulk(db, product_ids)
    return {"deleted": deleted}
