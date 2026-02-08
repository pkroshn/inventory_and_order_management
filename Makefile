.PHONY: up down build start stop restart logs test clean

# Default target: start the app
up:
	docker-compose up --build

# Start in detached mode (background)
up-d:
	docker-compose up --build -d

# Start the app (build + run in background)
start:
	docker-compose up --build -d

# Stop all services
stop:
	docker-compose down

# Stop (alias)
down:
	docker-compose down

# Build images without starting
build:
	docker-compose build

# Restart (down then up)
restart: down up

# View logs
logs:
	docker-compose logs -f

# Run backend tests
test:
	docker-compose run --rm backend pytest -v

# Run tests with coverage
test-cov:
	docker-compose run --rm backend pytest -v --cov=app --cov-report=term-missing

# Stop and remove volumes (full clean)
clean: down
	docker-compose down -v

# Run database migrations only
migrate:
	docker-compose run --rm backend alembic upgrade head

# Create new migration
migration:
	docker-compose run --rm backend alembic revision --autogenerate -m "$(msg)"

# Shell into backend container
shell:
	docker-compose run --rm backend sh

# Shell into database
db-shell:
	docker-compose exec db psql -U inventory_user -d inventory_db
