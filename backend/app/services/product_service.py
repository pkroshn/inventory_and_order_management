from sqlalchemy.orm import Session
from typing import List, Tuple
from app.models.product import Product
from app.schemas.product import ProductCreate, ProductResponse


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
        """List products with pagination"""
        total = db.query(Product).count()
        products = db.query(Product).offset(skip).limit(limit).all()
        return products, total

    @staticmethod
    def get_product(db: Session, product_id: int) -> Product | None:
        """Get a product by ID"""
        return db.query(Product).filter(Product.id == product_id).first()
