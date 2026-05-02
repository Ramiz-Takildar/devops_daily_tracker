#!/bin/bash

# DevOps Daily Tracker - Single Command Startup Script
# This script starts the entire application stack

set -e

echo "🚀 Starting DevOps Daily Tracker..."
echo "=================================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker is not running. Please start Docker Desktop first."
    exit 1
fi

# Navigate to project directory
cd "$(dirname "$0")"

# Stop any existing containers
echo "🛑 Stopping existing containers..."
docker-compose down

# Start all services
echo "🔄 Starting all services..."
docker-compose up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be ready..."
sleep 5

# Check if services are running
if docker ps | grep -q "devops-tracker"; then
    echo ""
    echo "✅ DevOps Daily Tracker is now running!"
    echo "=================================="
    echo ""
    echo "📱 Frontend:  http://localhost:3000"
    echo "🔧 Backend:   http://localhost:5000"
    echo "🗄️  Database: localhost:5432"
    echo ""
    echo "👤 Demo Account:"
    echo "   Email:    demo@devopstracker.com"
    echo "   Password: Demo123!"
    echo ""
    echo "📊 To view logs: docker-compose logs -f"
    echo "🛑 To stop app:  docker-compose down"
    echo ""
    echo "🎉 Happy tracking!"
else
    echo "❌ Error: Services failed to start. Check logs with: docker-compose logs"
    exit 1
fi
