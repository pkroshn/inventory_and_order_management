from datetime import datetime, timezone
from sqlalchemy.orm import Session
from typing import List, Tuple
from app.models.product import Product
from app.schemas.product import ProductCreate, ProductResponse, ProductUpdate


class ProductService:
    @staticmethod
    def create_product(db: Session, product_data: ProductCreate) -> Product:
        """Create a new product"""
        product = Product(
            name=product_data.name,
            price=product_data.price,
            stock_quantity=product_data.stock_quantity
        )
        db.add(product)
        db.commit()
        db.refresh(product)
        return product

    @staticmethod
    def list_products(db: Session, skip: int = 0, limit: int = 100) -> Tuple[List[Product], int]:
        """List products with pagination (excludes soft-deleted)."""
        base = db.query(Product).filter(Product.deleted_at.is_(None))
        total = base.count()
        products = base.order_by(Product.id).offset(skip).limit(limit).all()
        return products, total

    @staticmethod
    def get_product(db: Session, product_id: int) -> Product | None:
        """Get a product by ID (excludes soft-deleted)."""
        return db.query(Product).filter(
            Product.id == product_id,
            Product.deleted_at.is_(None)
        ).first()

    @staticmethod
    def update_product(db: Session, product_id: int, data: ProductUpdate) -> Product | None:
        """Update a product by ID (only if not soft-deleted)."""
        product = db.query(Product).filter(
            Product.id == product_id,
            Product.deleted_at.is_(None)
        ).first()
        if not product:
            return None
        if data.name is not None:
            product.name = data.name
        if data.price is not None:
            product.price = data.price
        if data.stock_quantity is not None:
            product.stock_quantity = data.stock_quantity
        db.commit()
        db.refresh(product)
        return product

    @staticmethod
    def delete_product(db: Session, product_id: int) -> bool:
        """Soft-delete a product by ID. Returns True if (soft) deleted."""
        product = db.query(Product).filter(
            Product.id == product_id,
            Product.deleted_at.is_(None)
        ).first()
        if not product:
            return False
        product.deleted_at = datetime.now(timezone.utc)
        db.commit()
        return True

    @staticmethod
    def delete_products_bulk(db: Session, product_ids: List[int]) -> int:
        """Soft-delete multiple products by IDs. Returns count of (soft) deleted."""
        if not product_ids:
            return 0
        from sqlalchemy import update
        result = db.execute(
            update(Product)
            .where(Product.id.in_(product_ids), Product.deleted_at.is_(None))
            .values(deleted_at=datetime.now(timezone.utc))
        )
        db.commit()
        return result.rowcount
