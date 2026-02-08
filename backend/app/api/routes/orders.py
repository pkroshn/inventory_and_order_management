from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.api.dependencies import get_database_session
from app.services.order_service import OrderService
from app.schemas.order import OrderCreate, OrderResponse, OrderStatusUpdate, OrderItemResponse
from app.models.order import OrderStatus
from app.exceptions import InsufficientStockError, ProductNotFoundError

router = APIRouter()


@router.post("/", response_model=OrderResponse, status_code=201)
def create_order(
    order_data: OrderCreate,
    db: Session = Depends(get_database_session)
):
    """Create a new order with stock reduction"""
    try:
        order = OrderService.create_order(db, order_data)
        # Eager load relationships for response
        order = OrderService.get_order(db, order.id)
        
        # Format response with product names
        order_items_response = []
        for item in order.order_items:
            order_items_response.append(OrderItemResponse(
                id=item.id,
                product_id=item.product_id,
                quantity_ordered=item.quantity_ordered,
                price_at_time=item.price_at_time,
                product_name=item.product.name if item.product else None
            ))
        
        return OrderResponse(
            id=order.id,
            created_at=order.created_at,
            status=order.status,
            order_items=order_items_response
        )
    except InsufficientStockError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except ProductNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.get("/", response_model=list[OrderResponse])
def list_orders(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_database_session)
):
    """List orders with pagination"""
    from sqlalchemy.orm import joinedload
    
    orders = db.query(Order).options(
        joinedload(Order.order_items).joinedload(OrderItem.product)
    ).order_by(Order.created_at.desc()).offset(skip).limit(limit).all()
    
    orders_response = []
    for order in orders:
        order_items_response = []
        for item in order.order_items:
            order_items_response.append(OrderItemResponse(
                id=item.id,
                product_id=item.product_id,
                quantity_ordered=item.quantity_ordered,
                price_at_time=item.price_at_time,
                product_name=item.product.name if item.product else None
            ))
        orders_response.append(OrderResponse(
            id=order.id,
            created_at=order.created_at,
            status=order.status,
            order_items=order_items_response
        ))
    
    return orders_response


@router.get("/{order_id}", response_model=OrderResponse)
def get_order(
    order_id: int,
    db: Session = Depends(get_database_session)
):
    """Get order details by ID"""
    order = OrderService.get_order(db, order_id)
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order with ID {order_id} not found"
        )
    
    # Format response with product names
    order_items_response = []
    for item in order.order_items:
        order_items_response.append(OrderItemResponse(
            id=item.id,
            product_id=item.product_id,
            quantity_ordered=item.quantity_ordered,
            price_at_time=item.price_at_time,
            product_name=item.product.name if item.product else None
        ))
    
    return OrderResponse(
        id=order.id,
        created_at=order.created_at,
        status=order.status,
        order_items=order_items_response
    )


@router.patch("/{order_id}/status", response_model=OrderResponse)
def update_order_status(
    order_id: int,
    status_update: OrderStatusUpdate,
    db: Session = Depends(get_database_session)
):
    """Update order status"""
    try:
        order = OrderService.update_order_status(db, order_id, status_update.status)
        
        # Reload with relationships
        order = OrderService.get_order(db, order.id)
        
        # Format response
        order_items_response = []
        for item in order.order_items:
            order_items_response.append(OrderItemResponse(
                id=item.id,
                product_id=item.product_id,
                quantity_ordered=item.quantity_ordered,
                price_at_time=item.price_at_time,
                product_name=item.product.name if item.product else None
            ))
        
        return OrderResponse(
            id=order.id,
            created_at=order.created_at,
            status=order.status,
            order_items=order_items_response
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
