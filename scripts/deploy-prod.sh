#!/bin/bash

set -e

echo "Starting production deployment..."

# Load environment variables
if [ -f .env.production ]; then
    export $(grep -v '^#' .env.production | xargs)
fi

# Build and start production services
echo "Building production images..."
docker compose -f docker-compose.prod.yml build

echo "Starting production services..."
docker compose -f docker-compose.prod.yml up -d

echo "Waiting for services to be healthy..."
docker compose -f docker-compose.prod.yml exec -T postgres pg_isready -U postgres || echo "Waiting for PostgreSQL..."
sleep 10

echo "Checking service health..."
docker compose -f docker-compose.prod.yml ps

echo "Production deployment complete!"
echo "Application is available at http://localhost"
echo "To view logs: docker compose -f docker-compose.prod.yml logs -f"
echo "To stop: docker compose -f docker-compose.prod.yml down"