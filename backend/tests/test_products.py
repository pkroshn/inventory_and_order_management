import pytest
from app.models.product import Product


def test_create_product(client, db_session):
    """Test creating a product"""
    response = client.post(
        "/api/v1/products/",
        json={
            "name": "New Product",
            "price": "25.99",
            "stock_quantity": 50
        }
    )
    
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "New Product"
    assert float(data["price"]) == 25.99
    assert data["stock_quantity"] == 50
    assert "id" in data


def test_list_products(client, sample_products):
    """Test listing products with pagination"""
    response = client.get("/api/v1/products/?skip=0&limit=10")
    
    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) == 3
    assert data["total"] == 3
    assert data["skip"] == 0
    assert data["limit"] == 10


def test_list_products_pagination(client, sample_products):
    """Test pagination"""
    response = client.get("/api/v1/products/?skip=1&limit=2")
    
    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) == 2
    assert data["total"] == 3
