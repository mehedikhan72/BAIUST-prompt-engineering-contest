#!/bin/bash

case "$1" in
  start)
    echo "🚀 Starting development environment..."
    docker-compose up --build --remove-orphans
    ;;
  stop)
    echo "⏹️  Stopping development environment..."
    docker-compose down
    ;;
  clean)
    echo "🧹 Cleaning up..."
    docker-compose down -v
    ;;
  seed)
    echo "🌱 Seeding database..."
    docker exec -it api npm run seed
    ;;
  logs)
    docker-compose logs -f
    ;;
  api)
    docker-compose logs -f api
    ;;
  client)
    docker-compose logs -f client
    ;;
  *)
    echo "Contest Platform - Available Commands:"
    echo "  ./dev.sh start   - Start all services"
    echo "  ./dev.sh stop    - Stop all services"
    echo "  ./dev.sh clean   - Stop and remove volumes"
    echo "  ./dev.sh seed    - Seed the database"
    echo "  ./dev.sh logs    - View all logs"
    echo "  ./dev.sh api     - View API logs"
    echo "  ./dev.sh client  - View client logs"
    ;;
esac

