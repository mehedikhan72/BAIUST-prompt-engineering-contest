DOCKER_COMPOSE_FILE = docker-compose.yml

dev:
	@echo "Starting development environment..."
	docker-compose -f $(DOCKER_COMPOSE_FILE) up --build --remove-orphans

stop:
	@echo "Stopping development environment..."
	docker-compose -f $(DOCKER_COMPOSE_FILE) down