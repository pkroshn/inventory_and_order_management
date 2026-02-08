import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient
from app.database import Base, get_db
from app.api.dependencies import get_database_session
from app.main import app
from app.models.product import Product
from app.models.order import Order


# Use in-memory SQLite for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db_session():
    """Create a fresh database for each test"""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session):
    """Create a test client with database dependency override"""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    def override_get_database_session():
        yield from override_get_db()

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_database_session] = override_get_database_session
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def sample_product(db_session):
    """Create a sample product for testing"""
    product = Product(
        name="Test Product",
        price=10.50,
        stock_quantity=100
    )
    db_session.add(product)
    db_session.commit()
    db_session.refresh(product)
    return product


@pytest.fixture
def sample_products(db_session):
    """Create multiple sample products for testing"""
    products = [
        Product(name="Product 1", price=10.00, stock_quantity=50),
        Product(name="Product 2", price=20.00, stock_quantity=30),
        Product(name="Product 3", price=15.00, stock_quantity=25),
    ]
    for product in products:
        db_session.add(product)
    db_session.commit()
    for product in products:
        db_session.refresh(product)
    return products
