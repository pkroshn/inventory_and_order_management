# Inventory & Order Management Service

A production-ready backend service for managing products and orders, built with FastAPI, PostgreSQL, SQLAlchemy, and React.

## Features

- **Product Management**: Create and list products with stock tracking
- **Order Management**: Create orders with automatic stock reduction
- **Transaction Safety**: Atomic order creation with row-level locking to prevent race conditions
- **Status Management**: Update order status with validation (Pending → Shipped → Cancelled)
- **RESTful API**: Clean, well-documented API endpoints
- **Frontend Dashboard**: React-based UI for viewing products and managing orders
- **Docker Support**: Complete Docker setup for easy deployment
- **Makefile**: Single-command start/stop and common tasks

## Tech Stack

### Backend
- **Python 3.11+**
- **FastAPI**: Modern, fast web framework
- **SQLAlchemy**: ORM for database operations
- **PostgreSQL**: Relational database
- **Alembic**: Database migrations
- **Pydantic**: Data validation
- **pytest**: Testing framework

### Frontend
- **React 18**
- **TypeScript**
- **Vite**: Build tool
- **Axios**: HTTP client

## Project Structure

```
inventory-service/
├── backend/
│   ├── app/
│   │   ├── models/          # SQLAlchemy models
│   │   ├── schemas/         # Pydantic schemas
│   │   ├── services/        # Business logic layer
│   │   ├── api/             # API routes
│   │   ├── database.py      # Database configuration
│   │   ├── config.py        # Application settings
│   │   └── main.py          # FastAPI app
│   ├── alembic/             # Database migrations
│   ├── tests/               # Test suite
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── api/             # API client
│   │   └── App.tsx
│   └── Dockerfile
├── docker-compose.yml
├── Makefile
└── README.md
```

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Make (optional; for `make start` / `make stop`—see [Make commands](#make-commands))
- (Optional) Python 3.11+ and Node.js 20+ for local development

### Single-command run (Make)

From the project root:

```bash
make start    # Build and start all services in the background
make stop     # Stop all services
```

Then open:
- **Frontend**: http://localhost:3000
- **API docs**: http://localhost:8000/docs
- **Health**: http://localhost:8000/health

### Running with Docker

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd inventory-service
   ```

2. **Set up environment variables** (optional)
   ```bash
   cp .env.example .env
   # Edit .env if needed
   ```

3. **Start all services**

   With Make (background):
   ```bash
   make start
   ```

   Or with Docker Compose (foreground, logs in terminal):
   ```bash
   docker-compose up --build
   ```
   Or just `make` / `make up`.

   This starts:
   - PostgreSQL on port 5432
   - FastAPI backend on http://localhost:8000
   - React frontend on http://localhost:3000

4. **Access the application**
   - Frontend: http://localhost:3000
   - API Documentation: http://localhost:8000/docs
   - API Health Check: http://localhost:8000/health

### Make commands

| Command        | Description                          |
|----------------|--------------------------------------|
| `make start`   | Start all services (background)      |
| `make stop`    | Stop all services                    |
| `make up`      | Start all services (foreground)      |
| `make up-d`    | Same as `make start`                 |
| `make down`    | Same as `make stop`                  |
| `make restart` | Stop then start                      |
| `make logs`    | Stream container logs                |
| `make test`    | Run backend tests                    |
| `make migrate` | Run database migrations              |
| `make clean`   | Stop and remove volumes              |
| `make shell`   | Shell into backend container         |
| `make db-shell`| Open PostgreSQL CLI                  |

### Running Locally (Development)

#### Backend

1. **Set up Python environment**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. **Set up database**
   ```bash
   # Make sure PostgreSQL is running
   # Update DATABASE_URL in .env or environment variables
   export DATABASE_URL="postgresql://user:password@localhost:5432/inventory_db"
   ```

3. **Run migrations**
   ```bash
   alembic upgrade head
   ```

4. **Start the server**
   ```bash
   uvicorn app.main:app --reload
   ```

#### Frontend

1. **Install dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Start development server**
   ```bash
   npm run dev
   ```

## API Endpoints

### Products

- `POST /api/v1/products` - Create a new product
  ```json
  {
    "name": "Product Name",
    "price": "29.99",
    "stock_quantity": 100
  }
  ```

- `GET /api/v1/products?skip=0&limit=100` - List products with pagination

### Orders

- `POST /api/v1/orders` - Create a new order
  ```json
  {
    "items": [
      {
        "product_id": 1,
        "quantity": 5
      }
    ]
  }
  ```

- `GET /api/v1/orders?skip=0&limit=100` - List orders with pagination

- `GET /api/v1/orders/{order_id}` - Get order details

- `PATCH /api/v1/orders/{order_id}/status` - Update order status
  ```json
  {
    "status": "Shipped"
  }
  ```

## Running Tests

With Make (from project root):

```bash
make test
```

Or manually:

```bash
cd backend
pytest
```

Test coverage includes:
- Product creation and listing
- Order creation with stock reduction
- Insufficient stock handling
- Order status updates
- Error handling

## Design Decisions

### 1. Concurrency Handling

To prevent race conditions when multiple orders try to purchase the same product simultaneously, the system uses **row-level locking** with `SELECT FOR UPDATE`. This ensures:

- Atomic stock checking and reduction
- No overselling (stock cannot go negative)
- Proper transaction isolation

**Implementation**: In `OrderService.create_order()`, products are locked before checking stock availability, ensuring that concurrent transactions cannot interfere with each other.

### 2. Transaction Management

All order creation logic is wrapped in a single database transaction:
- Stock reduction and order creation happen atomically
- On any error, the transaction is rolled back
- Database constraints (check constraints, foreign keys) provide additional safety

### 3. Status Validation

Order status transitions are validated:
- Cannot update a cancelled order
- Cannot change status from Shipped to Pending
- Status is stored as an enum type in the database

### 4. Separation of Concerns

The codebase follows a clean architecture pattern:
- **Models**: Database schema definitions
- **Schemas**: Request/response validation (Pydantic)
- **Services**: Business logic and transaction handling
- **Routes**: HTTP request handling and response formatting

### 5. Eager Loading

When fetching orders, related `order_items` and `products` are eagerly loaded using SQLAlchemy's `joinedload` to prevent N+1 query problems.

### 6. Error Handling

- Custom exceptions (`InsufficientStockError`, `ProductNotFoundError`)
- Proper HTTP status codes (400 for bad requests, 404 for not found, 500 for server errors)
- Detailed error messages for debugging

## Database Schema

### Products Table
- `id`: Primary key
- `name`: Product name (indexed)
- `price`: Decimal(10, 2)
- `stock_quantity`: Integer (non-negative constraint)

### Orders Table
- `id`: Primary key
- `created_at`: Timestamp
- `status`: Enum (Pending, Shipped, Cancelled)

### Order Items Table
- `id`: Primary key
- `order_id`: Foreign key to orders (CASCADE delete)
- `product_id`: Foreign key to products (RESTRICT delete)
- `quantity_ordered`: Integer
- `price_at_time`: Decimal(10, 2) - Historical price snapshot

## Future Improvements

Due to time constraints, the following features were not implemented but would be valuable additions:

1. **Order Cancellation Logic**: When an order is cancelled, stock should be restored. This requires additional business logic.

2. **Authentication & Authorization**: Add user authentication and role-based access control.

3. **Logging**: Implement structured logging (e.g., using Python's `logging` module or a service like Loguru).

4. **Monitoring**: Add health checks, metrics, and monitoring (e.g., Prometheus, Grafana).

5. **API Rate Limiting**: Implement rate limiting to prevent abuse.

6. **Caching**: Add Redis caching for frequently accessed products.

7. **Search & Filtering**: Add search and filtering capabilities for products and orders.

8. **Bulk Operations**: Support for bulk product creation and order updates.

9. **WebSocket Support**: Real-time updates for order status changes.

## Troubleshooting

### Database Connection Issues

If you encounter database connection errors:
1. Ensure PostgreSQL is running
2. Check `DATABASE_URL` environment variable
3. Verify database credentials in `.env` file

### Migration Issues

If migrations fail, run migrations from the project root:

```bash
make migrate
```

Or from the backend directory:

```bash
cd backend
alembic upgrade head
```

To create a new migration:

```bash
make migration msg="your description"
# or: cd backend && alembic revision --autogenerate -m "Description"
```

### Frontend Not Connecting to Backend

1. Check that the backend is running on port 8000
2. Verify `VITE_API_URL` in frontend environment
3. Check CORS settings in `backend/app/main.py`

## License

This project is created for evaluation purposes.

## Contact

For questions or issues, please open an issue in the repository.
