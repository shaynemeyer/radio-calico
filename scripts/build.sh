#!/bin/bash

# Build script for RadioCalico Docker images
set -e

echo "🚀 Building RadioCalico Docker images..."

# Get version from package.json
VERSION=$(node -p "require('./package.json').version")
echo "📦 Version: $VERSION"

# Build production image
echo "🏗️  Building production image..."
docker build -t radiocalico:latest -t radiocalico:$VERSION .

# Build development image
echo "🛠️  Building development image..."
docker build -f Dockerfile.dev -t radiocalico:dev .

echo "✅ Build completed successfully!"
echo ""
echo "Images built:"
echo "  - radiocalico:latest"
echo "  - radiocalico:$VERSION"
echo "  - radiocalico:dev"
echo ""
echo "To run:"
echo "  Production: docker-compose --profile production up"
echo "  Development: docker-compose --profile development up"