#!/bin/bash

# DevOps Daily Tracker - Stop Application Script
# This script stops all application containers

set -e

echo "🛑 Stopping DevOps Daily Tracker..."
echo "=================================="

# Navigate to project directory
cd "$(dirname "$0")"

# Stop all services
docker-compose down

echo ""
echo "✅ DevOps Daily Tracker stopped successfully!"
echo "=================================="
echo ""
echo "📊 To view stopped containers: docker ps -a"
echo "🚀 To start again: ./START_APP.sh"
echo ""
