#!/bin/bash

echo "🚀 Starting Splitwise Clone Application..."
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose > /dev/null 2>&1; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✅ Docker is running"
echo "✅ Docker Compose is available"
echo ""

echo "🔧 Building and starting services..."
docker-compose up --build -d

echo ""
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check if services are running
if docker-compose ps | grep -q "Up"; then
    echo ""
    echo "🎉 Application is ready!"
    echo ""
    echo "📱 Frontend: http://localhost:3000"
    echo "🔌 Backend API: http://localhost:8000"
    echo "📚 API Documentation: http://localhost:8000/docs"
    echo ""
    echo "To stop the application, run: docker-compose down"
    echo "To view logs, run: docker-compose logs -f"
else
    echo ""
    echo "❌ Something went wrong. Check the logs with: docker-compose logs"
fi
