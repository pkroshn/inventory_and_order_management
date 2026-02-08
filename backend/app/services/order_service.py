from sqlalchemy.orm import Session
from sqlalchemy import select
from typing import List
from app.models.order import Order, OrderStatus
from app.models.order_item import OrderItem
from app.models.product import Product
from app.schemas.order import OrderCreate, OrderItemCreate
from app.exceptions import InsufficientStockError, ProductNotFoundError


class OrderService:
    @staticmethod
    def create_order(db: Session, order_data: OrderCreate) -> Order:
        """
        Create an order with transactional stock reduction.
        Uses SELECT FOR UPDATE to prevent race conditions.
        """
        # Start transaction
        try:
            # Collect all product IDs
            product_ids = [item.product_id for item in order_data.items]
            
            # Lock products for update to prevent race conditions
            # This ensures atomic stock checking and reduction
            products_query = select(Product).where(Product.id.in_(product_ids)).with_for_update()
            products = db.execute(products_query).scalars().all()
            
            # Create a dictionary for quick lookup
            products_dict = {p.id: p for p in products}
            
            # Validate all products exist
            for item in order_data.items:
                if item.product_id not in products_dict:
                    raise ProductNotFoundError(f"Product with ID {item.product_id} not found")
            
            # Check stock availability and prepare stock reductions
            for item in order_data.items:
                product = products_dict[item.product_id]
                if product.stock_quantity < item.quantity:
                    raise InsufficientStockError(
                        f"Insufficient stock for product '{product.name}'. "
                        f"Available: {product.stock_quantity}, Requested: {item.quantity}"
                    )
            
            # Create order
            order = Order(status=OrderStatus.PENDING)
            db.add(order)
            db.flush()  # Get order ID without committing
            
            # Create order items and reduce stock
            order_items = []
            for item in order_data.items:
                product = products_dict[item.product_id]
                
                # Reduce stock
                product.stock_quantity -= item.quantity
                
                # Create order item
                order_item = OrderItem(
                    order_id=order.id,
                    product_id=product.id,
                    quantity_ordered=item.quantity,
                    price_at_time=product.price
                )
                order_items.append(order_item)
                db.add(order_item)
            
            # Commit transaction
            db.commit()
            db.refresh(order)
            
            return order
            
        except (InsufficientStockError, ProductNotFoundError):
            db.rollback()
            raise
        except Exception as e:
            db.rollback()
            raise

    @staticmethod
    def get_order(db: Session, order_id: int) -> Order | None:
        """Get an order by ID with eager loading of order items and products"""
        from sqlalchemy.orm import joinedload
        
        return db.query(Order).options(
            joinedload(Order.order_items).joinedload(OrderItem.product)
        ).filter(Order.id == order_id).first()

    @staticmethod
    def update_order_status(db: Session, order_id: int, new_status: OrderStatus) -> Order:
        """Update order status with validation"""
        order = db.query(Order).filter(Order.id == order_id).first()
        
        if not order:
            raise ValueError(f"Order with ID {order_id} not found")
        
        # Validate status transition
        if order.status == OrderStatus.CANCELLED:
            raise ValueError("Cannot update status of a cancelled order")
        
        if order.status == OrderStatus.SHIPPED and new_status == OrderStatus.PENDING:
            raise ValueError("Cannot change status from Shipped to Pending")
        
        order.status = new_status
        db.commit()
        db.refresh(order)
        
        return order
