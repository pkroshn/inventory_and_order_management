from sqlalchemy import Column, Integer, String, Numeric, CheckConstraint, DateTime
from sqlalchemy.orm import relationship
from app.database import Base


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    price = Column(Numeric(10, 2), nullable=False)
    stock_quantity = Column(Integer, nullable=False, default=0)
    deleted_at = Column(DateTime(timezone=True), nullable=True, index=True)

    # Relationships
    order_items = relationship("OrderItem", back_populates="product")

    __table_args__ = (
        CheckConstraint('stock_quantity >= 0', name='check_stock_quantity_non_negative'),
    )
