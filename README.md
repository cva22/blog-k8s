# Blog App - Microservices Architecture

A blog application built with microservices architecture using Node.js, PostgreSQL, Prisma, RabbitMQ, and Next.js.

## Architecture

### Frontend

- **Web App** (`apps/web`) - Next.js-based frontend application

### Backend Microservices

- **Auth Service** (Port 3001) - Handles authentication and user management
- **Posts Service** (Port 3002) - Manages blog posts
- **Comments Service** (Port 3003) - Handles post comments (associated with posts)
- **Moderation Service** (Port 3004) - Content moderation
- **Query Service** (Port 3005) - Data aggregation and querying

### Infrastructure

- **RabbitMQ** - Message broker for inter-service communication
- **PostgreSQL** - Database for each microservice (independent databases)

## Getting Started

### Prerequisites

- Node.js 18+
- Docker and Docker Compose
- pnpm

### Quick Start

```bash
# Clone the repository
cd blog-app

# Install dependencies
pnpm install

# Start Docker services (PostgreSQL databases and RabbitMQ)
docker-compose up -d

# Generate Prisma clients
make generate

# Run database migrations
make migrate

# Start all services in development mode
make dev
```

Or use the Make commands:

```bash
make install  # Install dependencies
make dev      # Start development servers
make migrate  # Run migrations
make stop     # Stop Docker services
make clean    # Clean up everything
```

### Services Endpoints

Once running, the services are available at:

- **Web Frontend**: http://localhost:3000
- **Auth Service**: http://localhost:3001
- **Posts Service**: http://localhost:3002
- **Comments Service**: http://localhost:3003
- **Moderation Service**: http://localhost:3004
- **Query Service**: http://localhost:3005
- **RabbitMQ Management**: http://localhost:15672 (admin/admin)

### Database Ports

Each service has its own PostgreSQL database:

- Auth DB: localhost:5433
- Posts DB: localhost:5434
- Comments DB: localhost:5435
- Moderation DB: localhost:5436
- Query DB: localhost:5437

## Project Structure

```
blog-app/
├── apps/
│   ├── auth/        # Authentication microservice
│   ├── posts/       # Posts microservice
│   ├── comments/    # Comments microservice
│   ├── moderation/  # Moderation microservice
│   ├── query/       # Query aggregation microservice
│   └── web/         # Next.js frontend
├── docker-compose.yml
├── Makefile
└── package.json
```

## Usage

### Creating a Post

```bash
curl -X POST http://localhost:3002/posts \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My First Post",
    "content": "This is the content of my post",
    "published": true,
    "authorId": "user-id"
  }'
```

### Fetching Posts

```bash
# Get all posts
curl http://localhost:3005/query/posts

# Get a specific post with comments
curl http://localhost:3005/query/post/<post-id>
```

### Adding a Comment

```bash
curl -X POST http://localhost:3003/comments \
  -H "Content-Type: application/json" \
  -d '{
    "postId": "post-id",
    "content": "Great post!",
    "authorId": "user-id"
  }'
```

## Development

### Running Individual Services

```bash
# Run auth service
pnpm --filter @blog-app/auth run dev

# Run posts service
pnpm --filter @blog-app/posts run dev

# etc...
```

### Database Management

```bash
# Open Prisma Studio for auth service
pnpm --filter @blog-app/auth run prisma:studio

# Same for other services
```

## Technologies

- **Frontend**: Next.js, TypeScript, Tailwind CSS
- **Backend**: NestJS, TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Message Broker**: RabbitMQ
- **Containerization**: Docker
- **Package Manager**: pnpm
- **Build System**: Turbo
