DOCKER_COMPOSE_FILE = docker-compose.yml

.PHONY: dev stop clean seed logs help

help:
	@echo "Contest Platform - Available Commands:"
	@echo "  make dev     - Start all services in development mode"
	@echo "  make stop    - Stop all services"
	@echo "  make clean   - Stop services and remove volumes"
	@echo "  make seed    - Seed the database with initial data"
	@echo "  make logs    - View logs from all services"
	@echo "  make api     - View API logs"
	@echo "  make client  - View client logs"

dev:
	@echo "🚀 Starting development environment..."
	docker-compose -f $(DOCKER_COMPOSE_FILE) up --build --remove-orphans

stop:
	@echo "⏹️  Stopping development environment..."
	docker-compose -f $(DOCKER_COMPOSE_FILE) down

clean:
	@echo "🧹 Cleaning up..."
	docker-compose -f $(DOCKER_COMPOSE_FILE) down -v

seed:
	@echo "🌱 Seeding database..."
	docker exec -it api npm run seed

logs:
	docker-compose -f $(DOCKER_COMPOSE_FILE) logs -f

api:
	docker-compose -f $(DOCKER_COMPOSE_FILE) logs -f api

client:
	docker-compose -f $(DOCKER_COMPOSE_FILE) logs -f client
