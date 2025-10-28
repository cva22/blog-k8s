#!/bin/bash

# Blog App Setup Script

echo "🚀 Setting up Blog App with Microservices Architecture..."

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null
then
    echo "❌ pnpm is not installed. Please install it first:"
    echo "npm install -g pnpm"
    exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null
then
    echo "❌ Docker is not running. Please start Docker Desktop."
    exit 1
fi

echo "✅ Prerequisites check passed!"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
pnpm install

# Start Docker containers
echo ""
echo "🐳 Starting Docker containers..."
docker-compose up -d

# Wait for databases to be ready
echo ""
echo "⏳ Waiting for databases to be ready..."
sleep 5

# Generate Prisma clients
echo ""
echo "🔧 Generating Prisma clients..."
pnpm --filter @blog-app/auth run prisma:generate
pnpm --filter @blog-app/posts run prisma:generate
pnpm --filter @blog-app/comments run prisma:generate
pnpm --filter @blog-app/moderation run prisma:generate

# Run migrations
echo ""
echo "🗄️  Running database migrations..."
pnpm --filter @blog-app/auth run prisma:migrate
pnpm --filter @blog-app/posts run prisma:migrate
pnpm --filter @blog-app/comments run prisma:migrate
pnpm --filter @blog-app/moderation run prisma:migrate

echo ""
echo "✅ Setup completed successfully!"
echo ""
echo "📍 Services are running on:"
echo "   - Web Frontend: http://localhost:3000"
echo "   - Auth Service: http://localhost:3001"
echo "   - Posts Service: http://localhost:3002"
echo "   - Comments Service: http://localhost:3003"
echo "   - Moderation Service: http://localhost:3004"
echo "   - Query Service: http://localhost:3005"
echo "   - RabbitMQ Management: http://localhost:15672"
echo ""
echo "To start all services, run:"
echo "   make dev"
echo ""
echo "Or start them individually:"
echo "   pnpm dev"


