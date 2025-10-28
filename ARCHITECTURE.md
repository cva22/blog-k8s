# Blog App Architecture

## Overview

This is a microservices-based blog application with the following architecture:

## Services

### 1. Auth Service (Port 3001)

**Database**: PostgreSQL (localhost:5433)  
**Purpose**: User authentication and session management  
**Key Features**:

- User registration
- User login
- Session management
- Token validation

**API Endpoints**:

- `POST /auth/register` - Register a new user
- `POST /auth/login` - Login user
- `POST /auth/validate` - Validate token
- `POST /auth/logout` - Logout user

### 2. Posts Service (Port 3002)

**Database**: PostgreSQL (localhost:5434)  
**Purpose**: Blog post management  
**Key Features**:

- Create posts
- Update posts
- Delete posts
- List posts (with filtering)

**API Endpoints**:

- `GET /posts` - Get all posts
- `GET /posts/:id` - Get a specific post
- `POST /posts` - Create a new post
- `PATCH /posts/:id` - Update a post
- `DELETE /posts/:id` - Delete a post

### 3. Comments Service (Port 3003)

**Database**: PostgreSQL (localhost:5435)  
**Purpose**: Comment management for posts  
**Key Features**:

- Create comments (associated with posts via postId)
- Update comments
- Delete comments
- List comments for a specific post

**API Endpoints**:

- `GET /comments` - Get all comments
- `GET /comments?postId=xxx` - Get comments for a post
- `GET /comments/:id` - Get a specific comment
- `POST /comments` - Create a new comment
- `PATCH /comments/:id` - Update a comment
- `DELETE /comments/:id` - Delete a comment

### 4. Moderation Service (Port 3004)

**Database**: PostgreSQL (localhost:5436)  
**Purpose**: Content moderation  
**Key Features**:

- Track moderation actions
- Approve/reject content
- Flag content
- View moderation history

**API Endpoints**:

- `GET /moderation` - Get all moderation actions
- `GET /moderation/:id` - Get a specific moderation action
- `GET /moderation/content/:contentId` - Get moderation history for content
- `POST /moderation` - Create a moderation action

### 5. Query Service (Port 3005)

**Purpose**: Data aggregation service  
**No Database**: Aggregates data from other services

**Key Features**:

- Fetch posts with their comments
- Aggregate data from multiple services

**API Endpoints**:

- `GET /query/posts` - Get all posts with comments
- `GET /query/post/:id` - Get a post with its comments

### 6. Web App (Port 3000)

**Purpose**: Frontend application  
**Technology**: Next.js, TypeScript, Tailwind CSS

**Features**:

- View posts list
- View individual post with comments
- Add comments to posts
- Authentication UI

## Infrastructure

### RabbitMQ

**Port**: 5672  
**Management UI**: http://localhost:15672 (admin/admin)  
**Purpose**: Message broker for inter-service communication

### Docker Compose

Manages the following containers:

- RabbitMQ
- Auth Database (PostgreSQL)
- Posts Database (PostgreSQL)
- Comments Database (PostgreSQL)
- Moderation Database (PostgreSQL)

## Data Flow

1. **User Registration/Login**:

   - User → Web App → Auth Service → Auth Database

2. **Creating a Post**:

   - User → Web App → Posts Service → Posts Database

3. **Adding a Comment**:

   - User → Web App → Comments Service → Comments Database
   - Comments Service → RabbitMQ → Notify other services

4. **Viewing Posts**:

   - User → Web App → Query Service → Posts Service + Comments Service → Return aggregated data

5. **Content Moderation**:
   - Moderator → Moderation Service → RabbitMQ → Notify affected services

## Database Schemas

### Auth Service

- `users` - User accounts
- `sessions` - Active user sessions

### Posts Service

- `posts` - Blog posts

### Comments Service

- `comments` - Post comments (linked to posts via postId)

### Moderation Service

- `moderation_actions` - Moderation history

## Communication Patterns

- **Synchronous**: REST API calls between services
- **Asynchronous**: RabbitMQ events for cross-service communication
- **Data Aggregation**: Query Service fetches from multiple services

## Technology Stack

- **Runtime**: Node.js
- **Framework**: NestJS (backend), Next.js (frontend)
- **Database**: PostgreSQL (one per service)
- **ORM**: Prisma
- **Message Broker**: RabbitMQ
- **Styling**: Tailwind CSS
- **Package Manager**: pnpm
- **Build System**: Turbo (monorepo)

