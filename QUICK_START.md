# Quick Start Guide

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **pnpm** ([Install](https://pnpm.io/installation))
- **Docker Desktop** ([Download](https://www.docker.com/products/docker-desktop))
- **Make** (usually pre-installed on macOS/Linux)

## Installation Steps

### Option 1: Using the Setup Script (Recommended)

```bash
cd /Users/sivaselvaraj/Repos/cva/blog-app
./setup.sh
```

### Option 2: Manual Setup

1. **Install dependencies**:

   ```bash
   pnpm install
   ```

2. **Start Docker containers**:

   ```bash
   docker-compose up -d
   ```

3. **Generate Prisma clients**:

   ```bash
   make generate
   ```

4. **Run database migrations**:

   ```bash
   make migrate
   ```

5. **Start all services**:
   ```bash
   make dev
   ```

## Accessing the Application

Once all services are running:

- **Frontend**: http://localhost:3000
- **Auth Service**: http://localhost:3001
- **Posts Service**: http://localhost:3002
- **Comments Service**: http://localhost:3003
- **Moderation Service**: http://localhost:3004
- **Query Service**: http://localhost:3005
- **RabbitMQ Management**: http://localhost:15672 (login: admin/admin)

## Creating Your First Post

You can create posts via API or through the frontend:

### Via API:

```bash
curl -X POST http://localhost:3002/posts \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Welcome to Our Blog",
    "content": "This is the first post on our microservices blog app!",
    "published": true,
    "authorId": "default-user-id"
  }'
```

### Via Frontend:

1. Open http://localhost:3000
2. The posts will appear on the homepage
3. Click on any post to view details and comments

## Troubleshooting

### Port Already in Use

If a port is already in use, you can:

1. Stop the existing service using that port
2. Change the port in the service's `.env` file
3. Update the docker-compose.yml with the new port

### Database Connection Errors

Ensure Docker containers are running:

```bash
docker ps
```

If containers aren't running:

```bash
docker-compose up -d
```

### Prisma Client Errors

Regenerate Prisma clients:

```bash
make generate
```

### Clean Install

If you encounter issues, try a clean install:

```bash
make clean
make install
make migrate
make dev
```

## Common Commands

```bash
# Start all services
make dev

# Stop all services
make stop

# View running containers
docker ps

# View logs
docker-compose logs -f

# Restart a specific service
docker-compose restart auth-db

# Clean everything
make clean
```

## Next Steps

1. Explore the architecture documentation: `ARCHITECTURE.md`
2. Check individual service implementations in `apps/` directory
3. Customize the services to fit your needs
4. Integrate RabbitMQ for event-driven communication
5. Add authentication middleware to protect routes

## Development Workflow

1. Make changes to any service
2. The service will auto-reload (if using `make dev`)
3. Test your changes through the frontend or API
4. Use Prisma Studio to inspect the database:
   ```bash
   pnpm --filter @blog-app/auth run prisma:studio
   ```

## Database Management

Access Prisma Studio for each service:

```bash
# Auth Service DB
pnpm --filter @blog-app/auth run prisma:studio

# Posts Service DB
pnpm --filter @blog-app/posts run prisma:studio

# Comments Service DB
pnpm --filter @blog-app/comments run prisma:studio

# Moderation Service DB
pnpm --filter @blog-app/moderation run prisma:studio
```

## Shutting Down

To stop all services and containers:

```bash
make stop
```

Or to remove everything including volumes:

```bash
docker-compose down -v
```

