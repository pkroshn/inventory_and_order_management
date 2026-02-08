from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import api_router
from app.exceptions import InsufficientStockError, ProductNotFoundError
from app.database import engine, Base

# Create tables (in production, use Alembic migrations)
# Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Inventory & Order Management Service",
    description="A backend service for managing products and orders",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://frontend:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_router, prefix="/api/v1")


@app.get("/")
def root():
    return {"message": "Inventory & Order Management Service API"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}
