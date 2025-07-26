#!/bin/bash

# Test script for RadioCalico in Docker
set -e

echo "🧪 Running RadioCalico tests in Docker..."

# Build development image for testing
echo "🏗️  Building test image..."
docker build -f Dockerfile.dev -t radiocalico:test .

# Run tests in container
echo "▶️  Running tests..."
docker run --rm \
    -v $(pwd):/app \
    -w /app \
    radiocalico:test \
    npm test

echo "✅ All tests passed!"

# Optional: Run integration tests if Playwright is set up
if [ "$1" = "--integration" ]; then
    echo "🌐 Running integration tests..."
    
    # Start the application in background
    docker compose --profile development up -d
    
    # Wait for application to be ready
    sleep 10
    
    # Run Playwright tests
    docker run --rm \
        -v $(pwd):/app \
        -w /app \
        --network radiocalico_radiocalico-network \
        radiocalico:test \
        npm run test:integration
    
    # Stop the application
    docker compose --profile development down
    
    echo "✅ Integration tests completed!"
fi