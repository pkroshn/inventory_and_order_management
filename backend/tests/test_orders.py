import pytest
from app.models.product import Product
from app.models.order import Order
from app.models.order_item import OrderItem


def test_create_order_success(client, db_session, sample_product):
    """Test successful order creation with stock reduction"""
    initial_stock = sample_product.stock_quantity

    response = client.post(
        "/api/v1/orders/",
        json={
            "items": [
                {
                    "product_id": sample_product.id,
                    "quantity": 10
                }
            ]
        }
    )

    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "Pending"
    assert len(data["order_items"]) == 1
    assert data["order_items"][0]["quantity_ordered"] == 10
    assert data["order_items"][0]["product_id"] == sample_product.id

    # Verify stock was reduced (use same test session)
    db_session.expire_all()  # clear identity map so we see committed state
    updated_product = db_session.get(Product, sample_product.id)
    assert updated_product is not None
    assert updated_product.stock_quantity == initial_stock - 10


def test_create_order_insufficient_stock(client, sample_product):
    """Test order creation with insufficient stock"""
    response = client.post(
        "/api/v1/orders/",
        json={
            "items": [
                {
                    "product_id": sample_product.id,
                    "quantity": sample_product.stock_quantity + 1
                }
            ]
        }
    )
    
    assert response.status_code == 400
    data = response.json()
    assert "detail" in data
    assert "Insufficient stock" in data["detail"].lower() or "insufficient" in data["detail"].lower()


def test_create_order_product_not_found(client):
    """Test order creation with non-existent product"""
    response = client.post(
        "/api/v1/orders/",
        json={
            "items": [
                {
                    "product_id": 99999,
                    "quantity": 1
                }
            ]
        }
    )
    
    assert response.status_code == 404
    data = response.json()
    assert "detail" in data
    assert "not found" in data["detail"].lower()


def test_get_order(client, sample_product):
    """Test retrieving an order"""
    # First create an order
    create_response = client.post(
        "/api/v1/orders/",
        json={
            "items": [
                {
                    "product_id": sample_product.id,
                    "quantity": 5
                }
            ]
        }
    )
    assert create_response.status_code == 201
    order_id = create_response.json()["id"]
    
    # Then retrieve it
    response = client.get(f"/api/v1/orders/{order_id}")
    
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == order_id
    assert len(data["order_items"]) == 1
    assert data["order_items"][0]["quantity_ordered"] == 5


def test_get_order_not_found(client):
    """Test retrieving non-existent order"""
    response = client.get("/api/v1/orders/99999")
    
    assert response.status_code == 404
    data = response.json()
    assert "not found" in data["detail"].lower()


def test_update_order_status(client, sample_product):
    """Test updating order status"""
    # Create an order
    create_response = client.post(
        "/api/v1/orders/",
        json={
            "items": [
                {
                    "product_id": sample_product.id,
                    "quantity": 5
                }
            ]
        }
    )
    order_id = create_response.json()["id"]
    
    # Update status to Shipped
    response = client.patch(
        f"/api/v1/orders/{order_id}/status",
        json={"status": "Shipped"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "Shipped"


def test_update_cancelled_order_status(client, sample_product):
    """Test that cancelled orders cannot be updated"""
    # Create an order
    create_response = client.post(
        "/api/v1/orders/",
        json={
            "items": [
                {
                    "product_id": sample_product.id,
                    "quantity": 5
                }
            ]
        }
    )
    order_id = create_response.json()["id"]
    
    # Cancel the order
    cancel_response = client.patch(
        f"/api/v1/orders/{order_id}/status",
        json={"status": "Cancelled"}
    )
    assert cancel_response.status_code == 200
    
    # Try to update cancelled order
    update_response = client.patch(
        f"/api/v1/orders/{order_id}/status",
        json={"status": "Shipped"}
    )
    
    assert update_response.status_code == 400
    data = update_response.json()
    assert "cancelled" in data["detail"].lower()
