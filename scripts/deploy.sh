#!/bin/bash

# Deployment script for RadioCalico
set -e

ENVIRONMENT=${1:-production}
echo "🚀 Deploying RadioCalico in $ENVIRONMENT mode..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Build images first
./scripts/build.sh

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose --profile $ENVIRONMENT down

# Pull any base image updates
echo "📥 Updating base images..."
docker pull node:18-alpine

# Start services
echo "▶️  Starting $ENVIRONMENT services..."
docker-compose --profile $ENVIRONMENT up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be ready..."
sleep 10

if [ "$ENVIRONMENT" = "production" ]; then
    HEALTH_URL="http://localhost:3000"
else
    HEALTH_URL="http://localhost:3000"
fi

# Check if service is healthy
for i in {1..30}; do
    if curl -f $HEALTH_URL > /dev/null 2>&1; then
        echo "✅ RadioCalico is running and healthy!"
        echo "🌐 Access the application at: $HEALTH_URL"
        break
    fi
    echo "⏳ Waiting for service to be ready... ($i/30)"
    sleep 2
done

# Show running containers
echo ""
echo "📋 Running containers:"
docker-compose ps

echo ""
echo "📝 To view logs: docker-compose logs -f"
echo "🛑 To stop: docker-compose --profile $ENVIRONMENT down"